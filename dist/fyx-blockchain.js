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
exports.FyxBlockchain = void 0;
const AWS = __importStar(require("aws-sdk"));
const bsv_1 = require("bsv");
const http_errors_1 = __importDefault(require("http-errors"));
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
const run_sdk_1 = __importDefault(require("run-sdk"));
const { API_KEY, BLOCKCHAIN_BUCKET, JIG_TOPIC, MAPI, MAPI_KEY } = process.env;
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
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
class FyxBlockchain {
    constructor(network, mongo, redis, rpcClient) {
        this.network = network;
        this.mongo = mongo;
        this.redis = redis;
        this.rpcClient = rpcClient;
    }
    async broadcast(rawtx, mapiKey) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        const txid = tx.id();
        console.log('Broadcasting:', txid, rawtx);
        const spends = tx.txIns.map(t => `${new bsv_1.Br(t.txHashBuf).readReverse().toString('hex')}_o${t.txOutNum}`);
        const ts = Date.now();
        // Precalculate DB updates
        const outScripts = tx.txOuts
            .filter(txOut => txOut.script.isPubKeyHashOut())
            .map(txOut => txOut.script.toHex());
        const derivations = await this.mongo.db('accounts').collection('derivations').find({
            script: { $in: Array.from(new Set(outScripts)) },
            path: 'm/0/0'
        }, { projection: { pubkey: 1, path: 1, script: 1 } }).toArray();
        const scriptHashes = new Map();
        derivations.forEach(d => d.path === 'm/0/0' && scriptHashes.set(d.script, d._id));
        const spendsUpdate = {
            updateMany: {
                filter: { _id: { $in: spends } },
                update: { $set: { spendTxId: txid } }
            }
        };
        const txoUpdates = [spendsUpdate];
        tx.txOuts.forEach((txOut, vout) => {
            if (!txOut.script.isPubKeyHashOut())
                return;
            let script = txOut.script.toHex();
            let scripthash = scriptHashes.get(script);
            if (!scripthash)
                return;
            txoUpdates.push({
                updateOne: {
                    filter: { _id: `${txid}_o${vout}` },
                    update: {
                        $set: {
                            txid,
                            vout,
                            script,
                            scripthash,
                            satoshis: txOut.valueBn.toNumber(),
                        },
                        $setOnInsert: { ts, lockUntil: 0 }
                    },
                    upsert: true
                }
            });
        });
        const isRun = tx.txOuts.find(txOut => {
            var _a, _b, _c, _d, _e, _f;
            return txOut.script.chunks.length > 5 &&
                ((_b = (_a = txOut.script.chunks[2]) === null || _a === void 0 ? void 0 : _a.buf) === null || _b === void 0 ? void 0 : _b.compare(runBuf)) === 0 && (((_d = (_c = txOut.script.chunks[4]) === null || _c === void 0 ? void 0 : _c.buf) === null || _d === void 0 ? void 0 : _d.compare(cryptofightsBuf)) === 0 ||
                ((_f = (_e = txOut.script.chunks[4]) === null || _e === void 0 ? void 0 : _e.buf) === null || _f === void 0 ? void 0 : _f.compare(fyxBuf)) === 0);
        });
        const outputUpdates = [spendsUpdate];
        if (isRun) {
            try {
                const metadata = run_sdk_1.default.util.metadata(rawtx);
                metadata.out.forEach((hash, i) => {
                    outputUpdates.push({
                        updateOne: {
                            filter: { _id: `${txid}_o${metadata.vrun + 1 + i}` },
                            update: { $setOnInsert: { ts } },
                            upsert: true
                        }
                    });
                });
            }
            catch (e) {
                if (!e.message.includes('Bad payload structure') && !e.message.includes('Not a run transaction'))
                    throw e;
            }
        }
        // Broadcast transaction
        if (MAPI) {
            let resp;
            const config = {
                url: `${MAPI}/tx`,
                method: 'POST',
                data: { rawtx },
                headers: {
                    'Content-type': 'application/json',
                },
            };
            mapiKey = mapiKey || MAPI_KEY;
            console.log('MAPI_KEY:', mapiKey);
            if (mapiKey)
                config.headers['Authorization'] = `Bearer ${mapiKey}`;
            for (let retry = 0; retry < 3; retry++) {
                try {
                    resp = await (0, fyx_axios_1.default)(config);
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
            const { payload } = resp.data;
            const parsedPayload = JSON.parse(payload);
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
            this.mongo.db('blockchain').collection('txos').bulkWrite(txoUpdates),
            this.mongo.db('blockchain').collection('outputs').bulkWrite(outputUpdates),
            this.redis.set(`tx://${txid}`, rawtx),
            this.redis.publish('txn', txid),
            Promise.resolve().then(async () => BLOCKCHAIN_BUCKET && s3.putObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `tx/${txid}`,
                Body: rawtx
            }).promise())
        ]);
        if (JIG_TOPIC && isRun) {
            await sns.publish({
                TopicArn: JIG_TOPIC !== null && JIG_TOPIC !== void 0 ? JIG_TOPIC : '',
                Message: JSON.stringify({ txid })
            }).promise();
        }
        return txid;
    }
    async fetch(txid) {
        let rawtx = await this.redis.get(`tx://${txid}`);
        if (rawtx)
            return rawtx;
        if (this.rpcClient) {
            rawtx = await this.rpcClient.getRawTransaction(txid)
                .catch(e => console.error('getRawTransaction Error:', e.message));
        }
        if (!rawtx) {
            console.log('Fallback to WoC');
            const { data } = await (0, fyx_axios_1.default)(`https://api-aws.whatsonchain.com/v1/bsv/${this.network}/tx/${txid}/hex`, { headers: { 'woc-api-key': API_KEY } });
            rawtx = data;
        }
        if (!rawtx)
            throw new http_errors_1.default.NotFound();
        await this.redis.set(`tx://${txid}`, rawtx);
        return rawtx;
    }
    async utxos(owner, ownerType = 'script', limit = 1000) {
        let scripthash, script;
        if (ownerType === 'address') {
            const address = bsv_1.Address.fromString(owner);
            script = address.toTxOutScript();
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else if (ownerType === 'script') {
            script = bsv_1.Script.fromHex(owner);
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else {
            scripthash = owner;
        }
        const db = this.mongo.db('blockchain');
        const utxos = await db.collection('txos').find({ scripthash, spendTxId: null }, {
            projection: {
                txid: true,
                vout: true,
                script: true,
                satoshis: true
            },
            limit
        }).toArray();
        return utxos;
    }
    async utxoCount(owner, ownerType = 'script') {
        let scripthash, script;
        if (ownerType === 'address') {
            const address = bsv_1.Address.fromString(owner);
            script = address.toTxOutScript();
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else if (ownerType === 'script') {
            script = bsv_1.Script.fromHex(owner);
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else {
            scripthash = owner;
        }
        const db = this.mongo.db('blockchain');
        const count = await db.collection('txos').countDocuments({ scripthash, spendTxId: null });
        return count;
    }
    async balance(owner, ownerType = 'script') {
        let scripthash, script;
        if (ownerType === 'address') {
            const address = bsv_1.Address.fromString(owner);
            script = address.toTxOutScript();
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else if (ownerType === 'script') {
            script = bsv_1.Script.fromHex(owner);
            scripthash = bsv_1.Hash.sha256(script.toBuffer()).reverse().toString('hex');
        }
        else {
            scripthash = owner;
        }
        // if (MAPI) {
        //     const { data: { confirmed, unconfirmed } } = await axios(
        //         `https://api-aws.whatsonchain.com/v1/bsv/${this.network}/address/hash/${scripthash}/balance`,
        //         { headers: { 'woc-api-key': API_KEY } }
        //     );
        //     return confirmed + unconfirmed;
        // }
        const db = this.mongo.db('blockchain');
        const [balance] = await db.collection('txos').aggregate([
            { $match: { scripthash, spendTxId: null } },
            {
                $group: {
                    _id: '$scripthash',
                    balance: { '$sum': '$satoshis' }
                }
            }
        ]).toArray();
        return (balance === null || balance === void 0 ? void 0 : balance.balance) || 0;
    }
    async spends(txid, vout) {
        const db = this.mongo.db('blockchain');
        const jig = await db.collection('outputs').findOne({ _id: `${txid}_o${vout}` }, { projection: { spendTxId: true } });
        return jig === null || jig === void 0 ? void 0 : jig.spendTxId;
    }
    // TODO: Figure out what to do with this
    async time(txid) {
        return Date.now();
    }
    async loadParents(rawtx) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = bsv_1.Tx.fromHex(rawtx);
            const txOut = t.txOuts[txIn.txOutNum];
            return { script: txOut.script.toHex(), satoshis: txOut.valueBn.toNumber() };
        }));
    }
    async loadParentTxOuts(tx) {
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = bsv_1.Tx.fromHex(rawtx);
            return t.txOuts[txIn.txOutNum];
        }));
    }
    async applyPayment(tx, payment, change = true) {
        const now = Date.now();
        const address = bsv_1.Address.fromString(payment.from);
        const scripthash = bsv_1.Hash.sha256(address.toTxOutScript().toBuffer()).reverse().toString('hex');
        const db = this.mongo.db('blockchain');
        let inputSats = 0, outputSats = 0, byteCount = 0, inputCount = 0;
        while (inputSats < payment.amount) {
            const { value: utxo } = await db.collection('txos').findOneAndUpdate({ scripthash, spendTxId: null, lockUntil: { $lt: now } }, { $set: { lockUntil: now + LOCK_TIME } }, { projection: { txid: 1, vout: 1, script: 1, satoshis: 1 } });
            if (!utxo)
                throw new Error(`Insufficient UTXOS for ${scripthash}`);
            inputSats += utxo.satoshis;
            tx.addTxIn(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
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
        const db = this.mongo.db('blockchain');
        if (payer) {
            const address = bsv_1.Address.fromString(payer);
            const scripthash = bsv_1.Hash.sha256(address.toTxOutScript().toBuffer()).reverse().toString('hex');
            while (totalIn < totalOut + (size * satsPerByte)) {
                const { value: utxo } = await db.collection('txos').findOneAndUpdate({ scripthash, spendTxId: null, lockUntil: { $lt: now } }, { $set: { lockUntil: now + LOCK_TIME } }, { projection: { txid: 1, vout: 1, script: 1, satoshis: 1 } });
                if (!utxo)
                    throw new Error(`Insufficient UTXOS for ${scripthash}`);
                totalIn += utxo.satoshis;
                tx.addTxIn(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, new bsv_1.Script(), bsv_1.TxIn.SEQUENCE_FINAL);
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
exports.FyxBlockchain = FyxBlockchain;
//# sourceMappingURL=fyx-blockchain.js.map