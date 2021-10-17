"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxBlockchainPg = void 0;
const AWS = __importStar(require("aws-sdk"));
const bsv_1 = require("bsv");
const http_errors_1 = __importDefault(require("http-errors"));
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
const set_cookie_parser_1 = __importDefault(require("set-cookie-parser"));
const { API, API_KEY, BLOCKCHAIN_BUCKET, BROADCAST_QUEUE, CALLBACK_TOKEN, JIG_TOPIC, MAPI, MAPI_KEY } = process.env;
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const DUST_LIMIT = 273;
const SIG_SIZE = 107;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
const LOCK_TIME = 60000;
const MAX_SPLITS = 100;
const runBuf = Buffer.from('run', 'utf8');
const cryptofightsBuf = Buffer.from('cryptofights', 'utf8');
const fyxBuf = Buffer.from('fyx', 'utf8');
class FyxBlockchainPg {
    constructor(network, sql, redis, cache, rpcClient) {
        this.network = network;
        this.sql = sql;
        this.redis = redis;
        this.cache = cache;
        this.rpcClient = rpcClient;
    }
    async broadcast(rawtx, mapiKey) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        const txid = tx.id();
        const txidBuf = Buffer.from(txid, 'hex');
        console.log('Broadcasting:', txid, rawtx);
        console.log('Lookup derivations');
        const scripts = tx.txOuts
            .filter(txOut => txOut.script.isPubKeyHashOut())
            .map(txOut => txOut.script.toBuffer());
        let outCount = 0;
        if (scripts.length) {
            const [row] = await this.sql `
                SELECT count(scripthash) as count FROM derivations
                WHERE script IN (${scripts})`;
            outCount = row.count;
        }
        const spends = tx.txIns.map(t => ({
            txid: Buffer.from(t.txHashBuf).reverse(),
            vout: t.txOutNum,
            spend_txid: txidBuf
        }));
        // Find inputs
        const spendValues = spends.map(s => `(decode('${s.txid.toString('hex')}', 'hex'), ${s.vout})`).join(', ');
        let query = `SELECT t.txid, t.vout, t.spend_txid FROM txos t
            JOIN (VALUES ${spendValues}) as s(txid, vout) ON s.txid = t.txid AND s.vout = t.vout`;
        console.log('Spends Query:', query);
        const spentIns = await this.sql.unsafe(query);
        // Throw error if this transaction doesn't create outputs for our users or spend exiting outputs
        if (!outCount && !spentIns.count)
            throw new http_errors_1.default.Forbidden();
        // Throw error if any input is already spent, unless this is a rebroadcast
        if (spentIns.find(s => s.spend_txid !== null && s.spend_txid.toString('hex') !== txid)) {
            throw (0, http_errors_1.default)(422, `Input already spent: ${txid} - ${spentIns[0].txid.toString('hex')} ${spentIns[0].vout}`);
        }
        const utxos = [];
        await Promise.all(tx.txOuts.map(async (txOut, vout) => {
            if (!txOut.script.isPubKeyHashOut())
                return;
            const script = txOut.script.toBuffer();
            utxos.push({
                txid: txidBuf,
                vout,
                script,
                scripthash: (await bsv_1.Hash.asyncSha256(script)).reverse(),
                satoshis: txOut.valueBn.toNumber(),
            });
        }));
        // Broadcast transaction
        let response;
        if (MAPI) {
            let resp, axiosInstance = fyx_axios_1.default.create({ withCredentials: true });
            let cookie = JSON.parse((await this.redis.get(`taal-elb-cookie`)) || '[]');
            let headerConfig = { 'Content-type': 'application/json' };
            if (Array.isArray(cookie) && cookie.length > 0)
                headerConfig['Cookie'] = cookie.join('; '); // this will set the cookie as "cookie1=val1; cookie2=val2; "
            const config = {
                url: `${MAPI}/tx`,
                method: 'POST',
                data: {
                    rawtx,
                    callBackUrl: `${API}/mapi-callback`,
                    callBackToken: CALLBACK_TOKEN
                },
                headers: headerConfig,
                timeout: 5000
            };
            mapiKey = mapiKey || MAPI_KEY;
            console.log('MAPI_KEY:', mapiKey);
            if (mapiKey)
                config.headers['Authorization'] = `Bearer ${mapiKey}`;
            for (let retry = 0; retry < 3; retry++) {
                try {
                    resp = await axiosInstance(config);
                    console.log(`Response from Axios call to Taal - ${JSON.stringify(resp.headers)}`);
                    let respCookie = set_cookie_parser_1.default.parse(resp).map(cookie => `${cookie.name}=${cookie.value}`);
                    if (Array.isArray(respCookie) && respCookie.length > 0) {
                        console.log(`Saving response cookie from Taal - ${JSON.stringify(respCookie)}`);
                        await this.redis.set('taal-elb-cookie', JSON.stringify(respCookie));
                    }
                    else
                        console.log(`No cookie set in the response header from Taal. Retaining previously set value - ${cookie.join('; ')}`);
                    console.log('Broadcast Response:', txid, JSON.stringify(resp.data));
                    break;
                }
                catch (e) {
                    if (e.response) {
                        console.error('Broadcast Error:', txid, e.response.status, e.response.status, e.response.config, e.response.headers, e.response.data);
                    }
                    else {
                        console.error('Broadcast Error:', txid, ' - Response missing', e);
                    }
                    if (retry >= 2)
                        throw e;
                    console.log('Retrying Broadcast:', txid, retry);
                }
            }
            response = resp.data;
            const parsedPayload = JSON.parse(response.payload);
            const { returnResult, resultDescription } = parsedPayload;
            if (returnResult !== 'success' &&
                !resultDescription.includes('Transaction already known') &&
                !resultDescription.includes('Transaction already in the mempool')) {
                throw (0, http_errors_1.default)(422, `${txid} - ${resultDescription}`);
            }
        }
        else {
            try {
                await this.rpcClient.sendRawTransaction(rawtx);
            }
            catch (e) {
                if (e.message.includes('Transaction already known') || e.message.includes('Transaction already in the mempool')) {
                    console.log(`Error from sendRawTransaction: ${e.message}`);
                    console.log(`Error is ignored. Continuing`);
                }
                else
                    throw (0, http_errors_1.default)(422, e.message);
            }
        }
        await Promise.all([
            this.sql.begin(async (sql) => {
                await this.sql `
                    INSERT INTO txos ${this.sql(spends, 'txid', 'vout', 'spend_txid')}
                    ON CONFLICT(txid, vout) DO UPDATE 
                        SET spend_txid = EXCLUDED.spend_txid`;
                await this.sql `
                    INSERT INTO txos ${this.sql(utxos, 'txid', 'vout', 'scripthash', 'satoshis')}
                    ON CONFLICT(txid, vout) DO UPDATE 
                        SET scripthash = EXCLUDED.scripthash,
                            satoshis = EXCLUDED.satoshis`;
            }),
            this.cache.set(`tx://${txid}`, rawtx),
            this.redis.publish('txn', txid),
            Promise.resolve().then(async () => BLOCKCHAIN_BUCKET && s3.putObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `tx/${txid}`,
                Body: rawtx
            }).promise())
        ]);
        const isRun = tx.txOuts.find(txOut => {
            var _a, _b, _c, _d, _e, _f;
            return txOut.script.chunks.length > 5 &&
                ((_b = (_a = txOut.script.chunks[2]) === null || _a === void 0 ? void 0 : _a.buf) === null || _b === void 0 ? void 0 : _b.compare(runBuf)) === 0 && (((_d = (_c = txOut.script.chunks[4]) === null || _c === void 0 ? void 0 : _c.buf) === null || _d === void 0 ? void 0 : _d.compare(cryptofightsBuf)) === 0 ||
                ((_f = (_e = txOut.script.chunks[4]) === null || _e === void 0 ? void 0 : _e.buf) === null || _f === void 0 ? void 0 : _f.compare(fyxBuf)) === 0);
        });
        if (JIG_TOPIC && isRun) {
            await sns.publish({
                TopicArn: JIG_TOPIC !== null && JIG_TOPIC !== void 0 ? JIG_TOPIC : '',
                Message: JSON.stringify({ txid })
            }).promise();
        }
        if (BROADCAST_QUEUE) {
            await sqs.sendMessage({
                QueueUrl: BROADCAST_QUEUE || '',
                MessageBody: JSON.stringify({ txid })
            }).promise();
        }
        return txid;
    }
    async fetch(txid) {
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx)
            return rawtx;
        if (this.rpcClient) {
            rawtx = await this.rpcClient.getRawTransaction(txid)
                .catch(e => console.error('getRawTransaction Error:', e.message));
        }
        if (BLOCKCHAIN_BUCKET && !rawtx) {
            const obj = await s3.getObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `tx/${txid}`
            }).promise().catch(e => console.error('GetObject Error:', `tx/${txid}`, e.message));
            if (obj && obj.Body) {
                rawtx = obj.Body.toString('utf8');
            }
        }
        if (!rawtx) {
            console.log('Fallback to WoC Public');
            const { data } = await (0, fyx_axios_1.default)(`https://api-aws.whatsonchain.com/v1/bsv/${this.network}/tx/${txid}/hex`, { headers: { 'woc-api-key': API_KEY } });
            rawtx = data;
        }
        if (!rawtx)
            throw new http_errors_1.default.NotFound();
        await this.cache.set(`tx://${txid}`, rawtx);
        return rawtx;
    }
    calculateScriptHash(owner, ownerType) {
        let scripthash, script;
        if (ownerType === 'address') {
            const address = bsv_1.Address.fromString(owner);
            script = address.toTxOutScript();
            return bsv_1.Hash.sha256(script.toBuffer()).reverse();
        }
        else if (ownerType === 'script') {
            script = bsv_1.Script.fromHex(owner);
            return bsv_1.Hash.sha256(script.toBuffer()).reverse();
        }
        return Buffer.from(owner, 'hex');
    }
    async utxos(owner, ownerType = 'script', limit = 1000) {
        const scripthash = this.calculateScriptHash(owner, ownerType);
        const utxos = await this.sql `
            SELECT encode(txid, 'hex') as txid, vout, encode(script, 'hex') as script, satoshis 
            FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;
        return utxos;
    }
    async utxoCount(owner, ownerType = 'script') {
        const scripthash = this.calculateScriptHash(owner, ownerType);
        const [{ count }] = await this.sql `
            SELECT count(*) as count FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;
        return count || 0;
    }
    async balance(owner, ownerType = 'script') {
        const scripthash = this.calculateScriptHash(owner, ownerType);
        const [{ balance }] = await this.sql `
            SELECT sum(satoshis) as balance FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;
        return balance || 0;
    }
    async spends(txid, vout) {
        const [row] = await this.sql `
            SELECT spend_txid FROM txos
            WHERE txid = decode(${txid}, 'hex') AND vout = ${vout}`;
        return row === null || row === void 0 ? void 0 : row.spendTxId;
    }
    // TODO: Figure out what to do with this
    async time(txid) {
        return Date.now();
    }
    async loadParents(rawtx) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        const parentTxOuts = await this.loadParentTxOuts(tx);
        return parentTxOuts.map(txOut => ({ script: txOut.script.toHex(), satoshis: txOut.valueBn.toNumber() }));
    }
    async loadParentTxOuts(tx) {
        // TODO: read from database once populated
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = bsv_1.Tx.fromHex(rawtx);
            return t.txOuts[txIn.txOutNum];
        }));
    }
    async findAndLockUtxo(scripthash) {
        return this.sql.begin(async (sql) => {
            const [utxo] = await sql `
                SELECT txid, vout, satoshis FROM txos
                WHERE scripthash = ${scripthash} AND 
                    spend_txid IS NULL AND
                    lock_until < ${new Date()}
                LIMIT 1`;
            if (!utxo)
                throw new Error(`Insufficient UTXOS for ${scripthash.toString('hex')}`);
            await sql `UPDATE txos
                SET lock_until = ${new Date(Date.now() + LOCK_TIME)}
                WHERE txid = ${utxo.txid} AND vout = ${utxo.vout}`;
            return utxo;
        });
    }
    async applyPayment(tx, payment, change = true) {
        const now = Date.now();
        const address = bsv_1.Address.fromString(payment.from);
        const scripthash = bsv_1.Hash.sha256(address.toTxOutScript().toBuffer()).reverse();
        let inputSats = 0, outputSats = 0, byteCount = 0, inputCount = 0;
        while (inputSats < payment.amount) {
            const utxo = await this.findAndLockUtxo(scripthash);
            inputSats += utxo.satoshis;
            tx.addTxIn(Buffer.from(utxo.txid).reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
            inputCount++;
        }
        if (change && inputSats - payment.amount > DUST_LIMIT) {
            outputSats = inputSats - payment.amount;
            if (outputSats)
                tx.addTxOut(new bsv_1.Bn(outputSats), address.toTxOutScript());
            byteCount += OUTPUT_SIZE;
        }
        return { inputSats, inputCount, outputSats };
    }
    async applyPayments(rawtx, payments, payer, changeSplitSats = 0, satsPerByte = 0.25) {
        console.log('PAY:', payer, JSON.stringify(payments), rawtx, changeSplitSats, satsPerByte);
        const tx = bsv_1.Tx.fromHex(rawtx);
        let size = tx.toBuffer().length;
        let totalIn = 0;
        const parents = await this.loadParentTxOuts(tx);
        parents.forEach((txOut, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer();
            size += (scriptBuf.length > 50 ? 0 : SIG_SIZE);
            totalIn += txOut.valueBn.toNumber();
        }, 0);
        let totalOut = tx.txOuts.reduce((a, { valueBn }) => a + valueBn.toNumber(), 0);
        const now = Date.now();
        await Promise.all(payments.map(async (payment) => {
            const { inputSats, outputSats, inputCount } = await this.applyPayment(tx, payment, payment.from !== payer);
            totalIn += inputSats;
            totalOut += outputSats;
            size += inputCount * INPUT_SIZE;
            if (outputSats)
                size += OUTPUT_SIZE;
        }));
        if (payer) {
            const address = bsv_1.Address.fromString(payer);
            const scripthash = bsv_1.Hash.sha256(address.toTxOutScript().toBuffer()).reverse();
            while (totalIn < totalOut + (size * satsPerByte)) {
                const utxo = await this.findAndLockUtxo(scripthash);
                totalIn += utxo.satoshis;
                tx.addTxIn(Buffer.from(utxo.txid).reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
                size += INPUT_SIZE;
            }
            let change = totalIn - totalOut - Math.ceil(size * satsPerByte);
            console.log('Size:', size, 'TotalIn:', totalIn, 'TotalOut:', totalOut, 'Change:', change);
            if (change < 0)
                throw new Error(`Inadequate UTXOs for purse: ${payer}`);
            let changeOutputs = 0;
            const feePerOutput = Math.ceil(OUTPUT_SIZE * satsPerByte);
            while (change - feePerOutput > DUST_LIMIT) {
                if (changeSplitSats && change > changeSplitSats && changeOutputs++ < MAX_SPLITS) {
                    tx.addTxOut(new bsv_1.Bn(changeSplitSats), address.toTxOutScript());
                    change -= (changeSplitSats + feePerOutput);
                }
                else {
                    tx.addTxOut(new bsv_1.Bn(change - feePerOutput), address.toTxOutScript());
                    change = 0;
                }
            }
        }
        return tx.toHex();
    }
}
exports.FyxBlockchainPg = FyxBlockchainPg;
//# sourceMappingURL=fyx-blockchain-pg.js.map