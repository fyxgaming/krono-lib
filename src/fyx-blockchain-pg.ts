import { CloudWatch, S3, SNS, SQS } from 'aws-sdk';
import { Address, Bn, Hash, Script, Tx, TxIn } from 'bsv';
import createError from 'http-errors';
import { createHash } from 'crypto';
import axios from './fyx-axios';
import { IBlockchain } from './iblockchain';
import { FyxCache } from './fyx-cache';
import orderLockRegex from './order-lock-regex';
import { Pool } from 'pg';

const { API_KEY, BROADCAST_QUEUE, DEBUG, JIG_TOPIC, NAMESPACE } = process.env;

const DUST_LIMIT = 273;
const SIG_SIZE = 107;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
const LOCK_TIME = 300000;
const MAX_SPLITS = 100;

const runBuf = Buffer.from('run', 'utf8');
const cryptofightsBuf = Buffer.from('cryptofights', 'utf8');
const fyxBuf = Buffer.from('fyx', 'utf8');

export class FyxBlockchainPg implements IBlockchain {
    constructor(
        public network: string,
        private pool: Pool,
        private redis,
        private cache: FyxCache,
        private aws?: { s3: S3, sns: SNS, sqs: SQS, cloudwatch: CloudWatch},
        private rpcClient?
    ) { }

    async broadcast(rawtx: string, mapiKey?: string) {
        const tx = Tx.fromHex(rawtx);
        const txid = tx.id();
        const txidBuf = Buffer.from(txid, 'hex');
        console.log('Broadcasting:', txid, rawtx);

        const spends: {txid: Buffer, vout: number, market: boolean}[] = [];
        const spendOutpoints = new Set<string>();
        tx.txIns.forEach(txIn => {
            const outTxid = Buffer.from(txIn.txHashBuf).reverse();
            spendOutpoints.add(`${outTxid.toString('hex')}:${txIn.txOutNum}`);
            spends.push({
                txid: outTxid,
                vout: txIn.txOutNum,
                market: !!txIn.script.toHex().match(orderLockRegex)
            });
        });

        const utxos = [];
        tx.txOuts.forEach(async (t: any, vout: number) => {
            if (t.script.isSafeDataOut()) return;
            utxos.push({
                vout,
                scripthash: createHash('sha256').update(t.script.toBuffer()).digest().reverse(),
                satoshis: t.valueBn.toNumber(),
            });
        });

        if (this.aws.s3) {
            await this.aws?.s3.putObject({
                Bucket: `fyx-${NAMESPACE}-txns`,
                Key: txid,
                Body: tx.toBuffer()
            }).promise();
        }

        // Broadcast transaction
        console.time(`Updating DB: ${txid}`);
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const utxoSpends = spends.filter(s => !s.market);
            if(utxoSpends.length) {
                let values: any[] = [];
                let qRes = await client.query(`SELECT encode(txid, 'hex') || ':' || vout as outpoint FROM utxos
                    WHERE ${
                        utxoSpends.map(s => `(txid=$${values.push(s.txid)} AND vout=$${values.push(s.vout)})`).join(' OR ')
                    }
                    FOR UPDATE`,
                    values
                );
                for(let {outpoint} of qRes.rows) {
                    spendOutpoints.delete(outpoint);
                }
            }

            const marketSpends = spends.filter(s => s.market);
            if(marketSpends.length) {
                let values: any[] = [];
                let qRes = await client.query(`SELECT encode(txid, 'hex') || ':' || vout as outpoint FROM market
                    WHERE ${
                        marketSpends.map(s => `(txid=$${values.push(s.txid)} AND vout=$${values.push(s.vout)})`).join(' OR ')
                    }
                    FOR UPDATE`,
                    values
                );
                for(let {outpoint} of qRes.rows) {
                    spendOutpoints.delete(outpoint);
                }
            }
            if(spendOutpoints.size) {
                const outpoint = Array.from(spendOutpoints)[0];
                throw createError(422, `Input to ${txid} already spent: ${outpoint}`);
            }

            await client.query(`INSERT INTO txns(txid) 
                VALUES ($1) 
                ON CONFLICT DO NOTHING`,
                [txidBuf]
            );

            let values: any[] = [txidBuf];
            await client.query(`INSERT INTO spends(txid, vout, spend_txid)
                VALUES ${spends.map(s => `($${values.push(s.txid)}, $${values.push(s.vout)}, $1), `)}`,
                values
            );
            
            values = [txidBuf];
            await client.query(`INSERT INTO utxos(txid, vout, scripthash, satoshis)
                VALUES ${utxos.map(u => `($1, $${values.push(u.vout)}, $${values.push(u.scripthash)}, $${values.push(u.satoshis)}), `)}`,
                values
            );

            console.time(`Broadcasting: ${txid}`);
            try {
                await this.rpcClient.sendRawTransaction(rawtx);
            } catch (e: any) {
                if (e.message.includes('Transaction already known') || e.message.includes('Transaction already in the mempool')) {
                    console.log(`Error from sendRawTransaction: ${e.message}`);
                    console.log(`Error is ignored. Continuing`);
                }
                else throw createError(422, e.message);
            }
            console.timeEnd(`Broadcasting: ${txid}`);
            
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error(`Error Saving TX Data:`, e);
            throw e;
        } finally {
            client.release();
            console.timeEnd(`Updating DB: ${txid}`);
        }
        
        try {
            await Promise.all([
                this.cache.set(`tx://${txid}`, rawtx),
                this.redis.publish('txn', txid)
            ]);
        } catch (e: any) {
            console.error(`Error from set Redis cache code block`, e);
            throw e;
        }

        const isRun = tx.txOuts.find(txOut => {
            return txOut.script.chunks.length > 5 &&
                txOut.script.chunks[2]?.buf?.compare(runBuf) === 0 && (
                    txOut.script.chunks[4]?.buf?.compare(cryptofightsBuf) === 0 ||
                    txOut.script.chunks[4]?.buf?.compare(fyxBuf) === 0
                );
        });

        if (isRun && JIG_TOPIC) {
            await this.aws?.sns.publish({
                TopicArn: JIG_TOPIC ?? '',
                Message: JSON.stringify({ txid })
            }).promise();
        }

        if (BROADCAST_QUEUE) {
            await this.aws?.sqs.sendMessage({
                QueueUrl: BROADCAST_QUEUE || '',
                MessageBody: JSON.stringify({ txid })
            }).promise();
        }
        return txid;
    }

    async fetch(txid: string) {
        if (DEBUG) console.log('Fetch:', txid);
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx) {
            if (DEBUG) console.log('Found in cache:', txid);
            return rawtx;
        }

        if (!rawtx) {
            const obj = await this.aws?.s3.getObject({
                Bucket: `fyx-${NAMESPACE}-txns`,
                Key: txid
            }).promise().catch(e => null);
            if (obj && obj.Body) {
                rawtx = obj.Body.toString('hex');
                if (DEBUG) console.log('Loaded from s3:', txid);
            }
        }

        if (this.rpcClient) {
            rawtx = await this.rpcClient.getRawTransaction(txid)
                .catch(e => console.error(e => false));
            if (DEBUG && rawtx) console.log('Loaded from node:', txid);
        }

        if (!rawtx) {
            console.log('Fallback to WoC Public', txid);
            const { data } = await axios(
                `https://api-aws.whatsonchain.com/v1/bsv/${this.network}/tx/${txid}/hex`,
                { headers: { 'woc-api-key': API_KEY } }
            );
            rawtx = data;
            if (rawtx) {
                await this.aws?.s3.putObject({
                    Bucket: `fyx-${NAMESPACE}-txns`,
                    Key: txid,
                    Body: Buffer.from(rawtx, 'hex')
                }).promise();
            }
        }
        if (!rawtx) throw new createError.NotFound();
        await this.cache.set(`tx://${txid}`, rawtx);
        return rawtx;
    }

    async calculateScriptHash(owner: string, ownerType: string): Promise<Buffer> {
        let script;
        if (ownerType === 'scripthash') {
            return Buffer.from(owner, 'hex');
        } else if (ownerType === 'address') {
            const address = Address.fromString(owner);
            script = address.toTxOutScript();
        } else if (ownerType === 'script') {
            script = Script.fromHex(owner);
        } else {
            throw new Error('Invalid ownerType');
        }
        return (await Hash.asyncSha256(script.toBuffer())).reverse();

    }

    async utxos(owner: string, ownerType = 'script', limit = 1000) {
        const scripthash = await this.calculateScriptHash(owner, ownerType);
        const { rows: utxos } = await this.pool.query(`SELECT encode(txid, 'hex') as txid, vout, satoshis 
            FROM utxos 
            WHERE scripthash = $1`,
            [scripthash]
        );
        return utxos;
    }

    async utxoCount(owner: string, ownerType = 'script') {
        const scripthash = await this.calculateScriptHash(owner, ownerType);
        const { rows: [{ count }] } = await this.pool.query(`
            SELECT count(txid) as count FROM utxos 
            WHERE scripthash = $1`,
            [scripthash]
        );
        return count || 0;
    }

    async balance(owner: string, ownerType = 'script') {
        const scripthash = await this.calculateScriptHash(owner, ownerType);
        const { rows: [{ balance }] } = await this.pool.query(`
            SELECT sum(satoshis) as balance FROM utxos 
            WHERE scripthash = $1`,
            [scripthash]
        );
        return balance || 0;
    }

    async spends(txid: string, vout: number | string) {

        const { rows: [spend] } = await this.pool.query(`
            SELECT encode(spend_txid, 'hex') as spends 
            FROM jig_txos_spent
            WHERE txid = decode($1, 'hex') AND vout=$2`,
            [txid, vout]
        );
        return spend?.spend_txid;
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
        return Promise.all(tx.txIns.map(async txIn => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = Tx.fromHex(rawtx);
            return t.txOuts[txIn.txOutNum];
        }))
    }

    async findAndLockUtxo(scripthash: Buffer): Promise<{ txid: Buffer, vout: number, satoshis: number }> {
        console.log('findAndLockUtxo', scripthash.toString('hex'));
        const { rows: [utxo] } = await this.pool.query(`UPDATE utxos u
            SET lock_until = $1
            FROM (SELECT txid, vout
                FROM utxos
                WHERE scripthash = $2 AND lock_until < current_timestamp
                LIMIT 1
                FOR UPDATE SKIP LOCKED) l 
            WHERE l.txid = u.txid AND l.vout = u.vout
            RETURNING u.txid, u.vout, u.satoshis`,
            [new Date(Date.now() + LOCK_TIME), scripthash]
        );
        if (!utxo) throw new Error(`Insufficient UTXOS for ${scripthash.toString('hex')}`)
        console.log('UTXO Selected:', scripthash.toString('hex'), JSON.stringify({
            ...utxo,
            txid: utxo.txid.toString('hex')
        }));
        return {
            txid: utxo.txid,
            vout: utxo.vout,
            satoshis: parseInt(utxo.satoshis)
        };
    }

    async applyPayment(tx, payment: { from: string, amount: number }, change = true) {
        const address = Address.fromString(payment.from);
        const scripthash = (await Hash.asyncSha256(address.toTxOutScript().toBuffer())).reverse();

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
        const tx = Tx.fromHex(rawtx);
        const txid = tx.id();
        console.log('PAY:', payer, JSON.stringify(payments), txid, changeSplitSats, satsPerByte);
        let size = tx.toBuffer().length;
        let totalIn = 0;
        const parents = await this.loadParentTxOuts(tx);
        console.time(`loading parents: ${txid}`);
        parents.forEach((txOut, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer()
            size += (scriptBuf.length > 50 ? 0 : SIG_SIZE);
            totalIn += txOut.valueBn.toNumber();
        }, 0);
        console.timeEnd(`loading parents: ${txid}`);
        let totalOut = tx.txOuts.reduce((a, { valueBn }) => a + valueBn.toNumber(), 0);

        console.time(`applying payments: ${txid}`);
        for (let payment of payments) {
            const { inputSats, outputSats, inputCount } = await this.applyPayment(tx, payment, payment.from !== payer);
            totalIn += inputSats;
            totalOut += outputSats;
            size += inputCount * INPUT_SIZE;
            if (outputSats) size += OUTPUT_SIZE;
        }
        console.timeEnd(`applying payments: ${txid}`);

        if (payer) {
            const address = Address.fromString(payer);
            console.time(`calculating scripthash: ${txid}`);
            const scripthash = (await Hash.asyncSha256(address.toTxOutScript().toBuffer())).reverse();
            console.timeEnd(`calculating scripthash: ${txid}`);
            console.time(`applying fees: ${txid}`);
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
            console.timeEnd(`applying fees: ${txid}`);

            console.time(`calculating change: ${txid}`);
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
            console.timeEnd(`calculating change: ${txid}`);
        }
        return tx.toHex();
    }
}