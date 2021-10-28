import { Address, Bn, Hash, Script, Tx, TxIn } from 'bsv';
import createError from 'http-errors';
import { createHash } from 'crypto';
import axios from './fyx-axios';
import cookieparser from 'set-cookie-parser';
import { IBlockchain } from './iblockchain';
import { FyxCache } from './fyx-cache';
import orderLockRegex from './order-lock-regex';

const { API, API_KEY, BLOCKCHAIN_BUCKET, BROADCAST_QUEUE, CALLBACK_TOKEN, DEBUG, JIG_TOPIC, MAPI, MAPI_KEY } = process.env;

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
    constructor(
        public network: string,
        private sql,
        private redis,
        private cache: FyxCache,
        private aws?: { s3: any, sns: any, sqs: any },
        private rpcClient?
    ) { }

    async broadcast(rawtx: string, mapiKey?: string) {
        const tx = Tx.fromHex(rawtx);
        const txid = tx.id();
        const txidBuf = Buffer.from(txid, 'hex');
        console.log('Broadcasting:', txid, rawtx);

        const pubkeys = tx.txIns.map(t => t.script.isPubKeyHashIn() && t.script.chunks[1].buf).filter(b => b);
        const outScripts = tx.txOuts
            .filter(txOut => txOut.script.isPubKeyHashOut())
            .map(txOut => txOut.script.toBuffer());

        const derivations = await this.sql`SELECT encode(script, 'hex') as script, 
                encode(pubkey, 'hex') as pubkey, path
            FROM derivations
            WHERE pubkey IN (${pubkeys.length ? pubkeys : Buffer.from('00', 'hex')}) 
                OR script IN (${outScripts.length ? outScripts : Buffer.from('00', 'hex')})`;
        if (!derivations.length) {
            console.log('No pubkeys or scripts:', txid);
            throw new createError.NotFound();
        }
        console.log('Derivations:', JSON.stringify(derivations));

        const pubkeysPaths = new Map<string, string>();
        const scriptPaths = new Map<string, string>();
        derivations.forEach(d => {
            pubkeysPaths.set(d.pubkey, d.path);
            scriptPaths.set(d.script, d.path);
        });
        // logging
        console.log(`pubkeysPaths: ${JSON.stringify(pubkeysPaths, null, 4)}`);
        console.log(`scriptPaths: ${JSON.stringify(scriptPaths, null, 4)}`);
        // end logging
        const fundSpends = [];
        const jigSpends = [];
        const marketSpends = [];
        console.log(`Analyzing spends...`);
        try {
            for(let i = 0; i < tx.txIns.length; i++ ) {
                const t = tx.txIns[i];
                const pubkey = t.script.isPubKeyHashIn() && t.script.chunks[1].buf.toString('hex');
                const path = pubkeysPaths.get(pubkey);
                const spend = {
                    txid: Buffer.from(t.txHashBuf).reverse(),
                    vout: t.txOutNum
                }
                
                if (path === 'm/0/0') {
                    const [spent] = await this.sql`SELECT encode(spend_txid, 'hex') as spend_txid
                    FROM fund_txos_spent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                    if (spent && spent.spend_txid !== txid) {
                        throw createError(422, `Input already spent: ${txid} - ${spend.txid.toString('hex')} ${spend.vout}`);
                    }
                    fundSpends.push(spend);
                } else if (path) {
                    const [spent] = await this.sql`SELECT encode(spend_txid, 'hex') as spend_txid
                    FROM jig_txos_spent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                    if (spent && spent.spend_txid !== txid) {
                        throw createError(422, `Input already spent: ${txid} - ${spend.txid.toString('hex')} ${spend.vout}`);
                    }
                    jigSpends.push(spend);
                } else if (t.script.toHex().match(orderLockRegex)) {
                    const [spent] = await this.sql`SELECT encode(spend_txid, 'hex') as spend_txid
                    FROM market_txos_spent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                    if (spent && spent.spend_txid !== txid) {
                        throw createError(422, `Input already spent: ${txid} - ${spend.txid.toString('hex')} ${spend.vout}`);
                    }
                    marketSpends.push(spend);
                }
            }
        } catch (e: any) {
            console.error(`Error from Analyzing spends block`, e);
            throw e;
        }
        // logging
        console.log(`Done Analyzing spends...`);
        // if (fundSpends.length > 0) console.log(`fundSpends array is ${JSON.stringify(fundSpends, null, 4)}`);
        // if (jigSpends.length > 0) console.log(`jigSpends array is ${JSON.stringify(jigSpends, null, 4)}`);
        // if (marketSpends.length > 0) console.log(`marketSpends array is ${JSON.stringify(marketSpends, null, 4)}`);
        // end logging

        const fundUtxos = [];
        const jigUtxos = [];
        const marketUtxos = [];
        console.log(`Building utxos...`);
        try {
            tx.txOuts.forEach(async (t: any, vout: number) => {
                if (t.script.isSafeDataOut()) return;
                const script = t.script.toHex();
                if (t.script.isPubKeyHashOut()) {
                    const path = scriptPaths.get(script);
                    if (path === 'm/0/0') {
                        fundUtxos.push({
                            txid: txidBuf,
                            vout,
                            scripthash: createHash('sha256').update(t.script.toBuffer()).digest().reverse(),
                            satoshis: t.valueBn.toNumber(),
                        });
                    } else if (path) {
                        jigUtxos.push({
                            txid: txidBuf,
                            vout,
                            scripthash: createHash('sha256').update(t.script.toBuffer()).digest().reverse(),
                            satoshis: t.valueBn.toNumber(),
                        });
                    }
                } else if (t.script.toHex().match(orderLockRegex)) {
                    marketUtxos.push({
                        txid: txidBuf,
                        vout
                    })
                }
            });
        } catch (e: any) {
            console.error(`Error from Building utxos`, e);
            throw e;
        }
        console.log(`Done Building utxos...`);

        if (BLOCKCHAIN_BUCKET) {
            await this.aws?.s3.putObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `txns/${txid}`,
                Body: rawtx
            }).promise();
        }

        // Broadcast transaction
        let response;
        console.log(`Broadcasting transaction...`);
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
                console.log(`MAPI Not Set - Successfully broadcasted transaction.`);
            } catch (e: any) {
                if (e.message.includes('Transaction already known') || e.message.includes('Transaction already in the mempool')) {
                    console.log(`Error from sendRawTransaction: ${e.message}`);
                    console.log(`Error is ignored. Continuing`);
                }
                else throw createError(422, e.message);
            }
        }

        console.log(`Inserting data into database`);
        try {
            await this.sql`INSERT INTO txns(txid) VALUES(${txidBuf}) ON CONFLICT DO NOTHING`,
                console.log('TX Updates:', txid, JSON.stringify({
                    spends: {
                        fund: fundSpends.map(s => ({ txid: s.txid.toString('hex'), vout: s.vout })),
                        jig: jigSpends.map(s => ({ txid: s.txid.toString('hex'), vout: s.vout })),
                        market: marketSpends.map(s => ({ txid: s.txid.toString('hex'), vout: s.vout }))
                    },
                    txos: {
                        fund: fundUtxos.map(s => ({ txid, vout: s.vout })),
                        jig: jigUtxos.map(s => ({ txid, vout: s.vout })),
                        market: marketUtxos.map(s => ({ txid, vout: s.vout }))
                    }
                }));
            await this.sql.begin(async sql => {
                for (let spend of fundSpends) {
                    await sql`INSERT INTO fund_txos_spent(txid, vout, scripthash, satoshis, spend_txid)
                    SELECT txid, vout, scripthash, satoshis, ${txidBuf} as spend_txid
                    FROM fund_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}
                    ON CONFLICT DO NOTHING`;
                    await sql`DELETE FROM fund_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                }
                if (fundUtxos.length) {
                    await sql`INSERT INTO fund_txos_unspent 
                    ${sql(fundUtxos, 'txid', 'vout', 'scripthash', 'satoshis')}
                    ON CONFLICT DO NOTHING`;
                }

                for (let spend of jigSpends) {
                    await sql`INSERT INTO jig_txos_spent(txid, vout, scripthash, satoshis, origin, kind, type, spend_txid)
                    SELECT txid, vout, scripthash, satoshis, origin, kind, type, ${txidBuf} as spend_txid
                    FROM jig_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}
                    ON CONFLICT DO NOTHING`;
                    await sql`DELETE FROM jig_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                }
                if (jigUtxos.length) {
                    await sql`INSERT INTO jig_txos_unspent 
                    ${sql(jigUtxos, 'txid', 'vout', 'scripthash', 'satoshis')}
                    ON CONFLICT DO NOTHING`;
                }

                for (let spend of marketSpends) {
                    await sql`INSERT INTO market_txos_spent(txid, vout, origin, user_id, spend_txid)
                    SELECT txid, vout, origin, user_id, ${txidBuf} as spend_txid
                    FROM market_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}
                    ON CONFLICT DO NOTHING`;
                    await sql`DELETE FROM market_txos_unspent
                    WHERE txid=${spend.txid} AND vout=${spend.vout}`;
                }
                if (marketUtxos.length) {
                    await sql`INSERT INTO market_txos_unspent 
                    ${sql(marketUtxos, 'txid', 'vout')}
                    ON CONFLICT DO NOTHING`;
                }
            });
        }
        catch (e: any) {
            console.error(`Error from Insert into DB code block`, e);
            throw e;
        }

        console.log(`Setting Redis cache`);

        try {
            await Promise.all([
                this.cache.set(`tx://${txid}`, rawtx),
                this.redis.publish('txn', txid)
            ]);
        }
        catch (e: any) {
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
        console.log(`All processes complete. Returning txid ${txid}`);
        return txid;
    }

    async fetch(txid: string) {
        if (DEBUG) console.log('Fetch:', txid);
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx) {
            if (DEBUG) console.log('Found in cache:', txid);
            return rawtx;
        }

        if (this.rpcClient) {
            rawtx = await this.rpcClient.getRawTransaction(txid)
                .catch(e => console.error(e => false));
            if (DEBUG && rawtx) console.log('Loaded from node:', txid);
        }

        if (!rawtx && BLOCKCHAIN_BUCKET) {
            const obj = await this.aws?.s3.getObject({
                Bucket: BLOCKCHAIN_BUCKET,
                Key: `txns/${txid}`
            }).promise().catch(e => null);
            if (obj && obj.Body) {
                rawtx = obj.Body.toString('utf8');
                if (DEBUG) console.log('Loaded from s3:', txid);
            }
        }

        if (!rawtx) {
            console.log('Fallback to WoC Public', txid);
            const { data } = await axios(
                `https://api-aws.whatsonchain.com/v1/bsv/${this.network}/tx/${txid}/hex`,
                { headers: { 'woc-api-key': API_KEY } }
            );
            rawtx = data;
            if (BLOCKCHAIN_BUCKET && rawtx) {
                await this.aws?.s3.putObject({
                    Bucket: BLOCKCHAIN_BUCKET,
                    Key: `txns/${txid}`,
                    Body: rawtx
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
        const utxos = await this.sql`
            SELECT encode(txid, 'hex') as txid, vout, satoshis 
            FROM fund_txos_unspent 
            WHERE scripthash = ${scripthash}`;
        return utxos;
    }

    async utxoCount(owner: string, ownerType = 'script') {
        const scripthash = await this.calculateScriptHash(owner, ownerType);
        const [{ count }] = await this.sql`
            SELECT count(*) as count FROM fund_txos_unspent 
            WHERE scripthash = ${scripthash}`;
        return count || 0;
    }

    async balance(owner: string, ownerType = 'script') {
        const scripthash = await this.calculateScriptHash(owner, ownerType);
        const [{ balance }] = await this.sql`
            SELECT sum(satoshis) as balance FROM fund_txos_unspent 
            WHERE scripthash = ${scripthash}`;
        return balance || 0;
    }

    async spends(txid: string, vout: number | string) {
        const [row] = await this.sql`
            SELECT encode(spend_txid, 'hex') as spend_txid FROM jig_txos_spent
            WHERE txid = decode(${txid}, 'hex') AND vout = ${vout}`;
        return row?.spend_txid;
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
        console.log('findAndLockUtxo', scripthash.toString('hex'));
        const [utxo] = await this.sql`UPDATE fund_txos_unspent f
            SET lock_until = ${new Date(Date.now() + LOCK_TIME)}
            FROM (SELECT txid, vout
                FROM fund_txos_unspent
                WHERE scripthash = ${scripthash} AND lock_until < current_timestamp
                LIMIT 1
            ) l 
            WHERE l.txid = f.txid AND l.vout = f.vout
            RETURNING f.txid, f.vout, f.satoshis`;
        if (!utxo) throw new Error(`Insufficient UTXOS for ${scripthash.toString('hex')}`)
        console.log('UTXO Selected:', scripthash.toString('hex'), JSON.stringify(utxo));
        return utxo;
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
        await Promise.all(payments.map(async (payment) => {
            const { inputSats, outputSats, inputCount } = await this.applyPayment(tx, payment, payment.from !== payer);
            totalIn += inputSats;
            totalOut += outputSats;
            size += inputCount * INPUT_SIZE;
            if (outputSats) size += OUTPUT_SIZE;
        }));
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