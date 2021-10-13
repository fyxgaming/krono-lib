import * as AWS from 'aws-sdk';
import { Address, Bn, Hash, Script, Tx, TxIn } from 'bsv';
import RpcClient from 'bitcoin-core';
import createError from 'http-errors';
import { Redis } from 'ioredis';
import postgres from 'postgres';
import axios from './fyx-axios';
import cookieparser from 'set-cookie-parser';
import { IBlockchain } from './iblockchain';
import { FyxCache } from './fyx-cache';

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

export class FyxBlockchainPg implements IBlockchain {
    constructor(public network: string, private sql: postgres, private redis: Redis, private cache: FyxCache, private rpcClient?: RpcClient) { }

    async broadcast(rawtx: string, mapiKey?: string) {
        const tx = Tx.fromHex(rawtx);
        const txid = tx.id();
        const txidBuf = Buffer.from(txid, 'hex');
        console.log('Broadcasting:', txid, rawtx);

        const [{ count }] = await this.sql`
            SELECT count(scripthash) as countFROM derivations
            WHERE script IN (${
                tx.txOuts
                    .filter(txOut => txOut.script.isPubKeyHashOut())
                    .map(txOut => txOut.script.toBuffer())
            })`;

        const spends = tx.txIns.map(t => ({
            txid: Buffer.from(t.txHashBuf).reverse(),
            vout: t.txOutNum,
            spend_txid: txidBuf
        }));

        // Find inputs
        const spendValues = spends.map(s => `(decode('${s.txid.toString('hex')}', 'hex'), ${s.vout}})`).join(', ');
        let query = `SELECT t.txid, t.vout, t.spend_txid FROM txos t
            JOIN (VALUES ${spendValues}) as s(txid, vout) ON s.txid = t.txid AND s.vout = t.vout`;
        console.log('Spends Query:', query);
        const spentIns = await this.sql.unsafe(query);

        // Throw error if this transaction doesn't create outputs for our users or spend exiting outputs
        if (!count && !spentIns.count) throw new createError.Forbidden();

        // Throw error if any input is already spent, unless this is a rebroadcast
        if (spentIns.find(s => s.spend_txid !== null && s.spend_txid.toString('hex') !== txid)) {
            throw createError(422, `Input already spent: ${txid} - ${spentIns[0].txid.toString('hex')} ${spentIns[0].vout}`);
        }

        const utxos = [];
        tx.txOuts.forEach((txOut: any, vout: number) => {
            if (!txOut.script.isPubKeyHashOut()) return;
            const script = txOut.script.toBuffer()
            utxos.push({
                txid: Buffer.from(txid, 'hex'),
                vout,
                script,
                scripthash: Hash.sha256(script).reverse(),
                satoshis: txOut.valueBn.toNumber(),
            });
        });

        // Broadcast transaction
        let response;
        if (MAPI) {
            let resp, axiosInstance = axios.create({ withCredentials: true });
            let cookie = JSON.parse((await this.redis.get(`taal-elb-cookie`)) || '[]');
            let headerConfig = { 'Content-type': 'application/json' };
            if (Array.isArray(cookie) && cookie.length > 0) headerConfig['Cookie'] = cookie.join('; '); // this will set the cookie as "cookie1=val1; cookie2=val2; "
            const config: any = {
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
            if (mapiKey) config.headers['Authorization'] = `Bearer ${mapiKey}`;
            for (let retry = 0; retry < 3; retry++) {
                try {
                    resp = await axiosInstance(config);
                    console.log(`Response from Axios call to Taal - ${JSON.stringify(resp.headers)}`);
                    let respCookie = cookieparser.parse(resp).map(cookie => `${cookie.name}=${cookie.value}`);
                    if (Array.isArray(respCookie) && respCookie.length > 0) {
                        console.log(`Saving response cookie from Taal - ${JSON.stringify(respCookie)}`)
                        await this.redis.set('taal-elb-cookie', JSON.stringify(respCookie));
                    }
                    else console.log(`No cookie set in the response header from Taal. Retaining previously set value - ${cookie.join('; ')}`);
                    console.log('Broadcast Response:', txid, JSON.stringify(resp.data));
                    break;
                } catch (e: any) {
                    if (e.response) {
                        console.error('Broadcast Error:', txid, e.response.status, e.response.status, e.response.config, e.response.headers, e.response.data);
                    } else {
                        console.error('Broadcast Error:', txid, ' - Response missing', e);
                    }
                    if (retry >= 2) throw e;
                    console.log('Retrying Broadcast:', txid, retry);
                }
            }
            response = resp.data;
            const parsedPayload = JSON.parse(response.payload);
            const { returnResult, resultDescription } = parsedPayload;
            if (returnResult !== 'success' &&
                !resultDescription.includes('Transaction already known') &&
                !resultDescription.includes('Transaction already in the mempool')) {
                throw createError(422, `${txid} - ${resultDescription}`);
            }
        } else {
            try {
                await this.rpcClient.sendRawTransaction(rawtx);
            } catch (e: any) {
                if (e.message.includes('Transaction already known') || e.message.includes('Transaction already in the mempool')) {
                    console.log(`Error from sendRawTransaction: ${e.message}`);
                    console.log(`Error is ignored. Continuing`);
                }
                else throw createError(422, e.message);
            }
        }

        await Promise.all([
            this.sql`
                INSERT INTO txos ${this.sql(spends, 'txid', 'vout', 'spend_txid')
                }
                ON CONFLICT(txid, vout) DO UPDATE 
                    SET spend_txid = EXCLUDED.spend_txid`,
            this.sql`
                INSERT INTO txos ${this.sql(utxos, 'txid', 'vout', 'scripthash', 'satoshis')
                }
                ON CONFLICT(txid, vout) DO UPDATE 
                    SET scripthash = EXCLUDED.scripthash,
                        satoshis = EXCLUDED.satoshis`,
            this.cache.set(`tx://${txid}`, rawtx),
            this.redis.publish('txn', txid),
            Promise.resolve().then(async () => BLOCKCHAIN_BUCKET && s3.putObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `tx/${txid}`,
                Body: rawtx
            }).promise())
        ]);

        const isRun = tx.txOuts.find(txOut => {
            return txOut.script.chunks.length > 5 &&
                txOut.script.chunks[2]?.buf?.compare(runBuf) === 0 && (
                    txOut.script.chunks[4]?.buf?.compare(cryptofightsBuf) === 0 ||
                    txOut.script.chunks[4]?.buf?.compare(fyxBuf) === 0
                );
        });

        if (JIG_TOPIC && isRun) {
            await sns.publish({
                TopicArn: JIG_TOPIC ?? '',
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

    async fetch(txid: string) {
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx) return rawtx;

        let [row] = await this.sql`
            SELECT encode(rawtx, 'hex') as rawtx FROM txns
            WHERE txid=decode(${txid}, 'hex')`;
        if (row) rawtx = row.rawtx;

        if (!rawtx && this.rpcClient) {
            rawtx = await this.rpcClient.getRawTransaction(txid)
                .catch(e => console.error('getRawTransaction Error:', e.message));
        }

        if (!rawtx) {
            console.log('Fallback to WoC Public');
            const { data } = await axios(
                `https://api-aws.whatsonchain.com/v1/bsv/${this.network}/tx/${txid}/hex`,
                { headers: { 'woc-api-key': API_KEY } }
            );
            rawtx = data;
        }
        if (!rawtx) throw new createError.NotFound();
        await this.cache.set(`tx://${txid}`, rawtx);
        return rawtx;
    }

    calculateScriptHash(owner: string, ownerType: string): Buffer {
        let scripthash, script;
        if (ownerType === 'address') {
            const address = Address.fromString(owner);
            script = address.toTxOutScript();
            return Hash.sha256(script.toBuffer()).reverse();
        } else if (ownerType === 'script') {
            script = Script.fromHex(owner);
            return Hash.sha256(script.toBuffer()).reverse();
        }
        return Buffer.from(owner, 'hex');
    }

    async utxos(owner: string, ownerType = 'script', limit = 1000) {
        const scripthash = this.calculateScriptHash(owner, ownerType);

        const utxos = await this.sql`
            SELECT encode(txid, 'hex') as txid, vout, encode(script, 'hex') as script, satoshis 
            FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;

        return utxos;
    }

    async utxoCount(owner: string, ownerType = 'script') {
        const scripthash = this.calculateScriptHash(owner, ownerType);

        const [{ count }] = await this.sql`
            SELECT count(id) as count FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;

        return count || 0;
    }

    async balance(owner: string, ownerType = 'script') {
        const scripthash = this.calculateScriptHash(owner, ownerType);
        const [{ balance }] = await this.sql`
            SELECT sum(satoshis) as balance FROM txos 
            WHERE scripthash = ${scripthash} AND spend_txid IS NULL`;

        return balance || 0;
    }

    async spends(txid: string, vout: number | string) {
        const [row] = await this.sql`
            SELECT spend_txid FROM txos
            WHERE txid = decode(${txid}, 'hex')} AND vout = ${vout}`;

        return row?.spendTxId;
    }

    // TODO: Figure out what to do with this
    async time(txid: string) {
        return Date.now();
    }

    async loadParents(rawtx: string): Promise<{ script: string, satoshis: number }[]> {
        const tx = Tx.fromHex(rawtx);
        const parentTxOuts = await this.loadParentTxOuts(tx);
        return parentTxOuts.map(txOut => (
            { script: txOut.script.toHex(), satoshis: txOut.valueBn.toNumber() }
        ));
    }

    async loadParentTxOuts(tx): Promise<any[]> {
        // TODO: read from database once populated
        return Promise.all(tx.txIns.map(async txIn => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = Tx.fromHex(rawtx);
            return t.txOuts[txIn.txOutNum];
        }))
    }

    async findAndLockUtxo(scripthash: Buffer): Promise<{ txid: Buffer, vout: number, satoshis: number }> {
        return this.sql.begin(async sql => {
            const [utxo] = await sql`
                SELECT txid, vout, satoshis FROM txos
                WHERE scripthash = ${scripthash} AND 
                    spend_txid IS NULL AND
                    lock_until < ${new Date()}
                LIMIT 1`;
            if (!utxo) throw new Error(`Insufficient UTXOS for ${scripthash.toString('hex')}`)
            await sql`UPDATE txos
                SET lock_until = ${new Date(Date.now() + LOCK_TIME)}
                WHERE txid = ${utxo.txid} AND vout = ${utxo.vout}`

            return utxo;
        });
    }
    async applyPayment(tx, payment: { from: string, amount: number }, change = true) {
        const now = Date.now();
        const address = Address.fromString(payment.from);
        const scripthash = Hash.sha256(address.toTxOutScript().toBuffer()).reverse();

        let inputSats = 0, outputSats = 0, byteCount = 0, inputCount = 0;
        while (inputSats < payment.amount) {
            const utxo = await this.findAndLockUtxo(scripthash);
            inputSats += utxo.satoshis;
            tx.addTxIn(
                Buffer.from(utxo.txid).reverse(),
                utxo.vout,
                Script.fromString('OP_0 OP_0'),
                TxIn.SEQUENCE_FINAL
            );
            inputCount++;
        }
        if (change && inputSats - payment.amount > DUST_LIMIT) {
            outputSats = inputSats - payment.amount;
            if (outputSats)
                tx.addTxOut(new Bn(outputSats), address.toTxOutScript());
            byteCount += OUTPUT_SIZE;
        }
        return { inputSats, inputCount, outputSats };
    }

    async applyPayments(rawtx, payments: { from: string, amount: number }[], payer?: string, changeSplitSats = 0, satsPerByte = 0.25) {
        console.log('PAY:', payer, JSON.stringify(payments), rawtx, changeSplitSats, satsPerByte);
        const tx = Tx.fromHex(rawtx);
        let size = tx.toBuffer().length;
        let totalIn = 0;
        const parents = await this.loadParentTxOuts(tx);
        parents.forEach((txOut, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer()
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
            if (outputSats) size += OUTPUT_SIZE;
        }));

        if (payer) {
            const address = Address.fromString(payer);
            const scripthash = Hash.sha256(address.toTxOutScript().toBuffer()).reverse();
            while (totalIn < totalOut + (size * satsPerByte)) {
                const utxo = await this.findAndLockUtxo(scripthash);
                totalIn += utxo.satoshis;
                tx.addTxIn(
                    Buffer.from(utxo.txid).reverse(),
                    utxo.vout,
                    Script.fromString('OP_0 OP_0'),
                    TxIn.SEQUENCE_FINAL
                );
                size += INPUT_SIZE;
            }

            let change = totalIn - totalOut - Math.ceil(size * satsPerByte);
            console.log('Size:', size, 'TotalIn:', totalIn, 'TotalOut:', totalOut, 'Change:', change);
            if (change < 0) throw new Error(`Inadequate UTXOs for purse: ${payer}`);

            let changeOutputs = 0;
            const feePerOutput = Math.ceil(OUTPUT_SIZE * satsPerByte);
            while (change - feePerOutput > DUST_LIMIT) {
                if (changeSplitSats && change > changeSplitSats && changeOutputs++ < MAX_SPLITS) {
                    tx.addTxOut(new Bn(changeSplitSats), address.toTxOutScript());
                    change -= (changeSplitSats + feePerOutput)
                } else {
                    tx.addTxOut(new Bn(change - feePerOutput), address.toTxOutScript());
                    change = 0;
                }
            }
        }
        return tx.toHex();
    }
}