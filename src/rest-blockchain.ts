import { Br, Tx } from 'bsv';
import { Buffer } from 'buffer';
import axios from './fyx-axios';
import { IBlockchain } from './iblockchain';
import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
export class RestBlockchain implements IBlockchain {
    private requests = new Map<string, Promise<any>>();
    constructor(
        public apiUrl: string,
        public network: string,
        public cache: { get: (key: string) => any, set: (key: string, value: any) => any } = new Map<string, any>(),
        public mapiKey?: string,
        protected debug = false,
    ) { }

    get bsvNetwork(): string {
        switch (this.network) {
            case 'stn':
                return 'stn';
            case 'main':
                return 'mainnet';
            default:
                return 'testnet';
        }
    }

    async broadcast(rawtx) {
        if (this.debug) console.log('BROADCAST:', rawtx);
        const { data: { txid } } = await axios.post(
            `${this.apiUrl}/broadcast`, 
            { rawtx, mapiKey: this.mapiKey }
        );
        this.debug && console.log('Broadcast:', txid);
        await this.cache.set(`tx://${txid}`, rawtx);
        return txid;
    }

    async retrieveOutputs(tx: Tx) {
        return Promise.all(tx.txIns.map(async txIn => {
            const txid = new Br(txIn.txHashBuf).readReverse().toString('hex');
            const outTx = Tx.fromHex(await this.fetch(txid));
            return {
                location: `${txid}_o${txIn.txOutNum}`,
                script: outTx.txOuts[txIn.txOutNum].script.toString(),
            };
        }));
    }

    async fetch(txid: string) {
        if (this.debug) console.log('FETCH:', txid);
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx) return rawtx;
        if (!this.requests.has(txid)) {
            const request = Promise.resolve().then(async () => {
                const { data: { rawtx } } = await axios(`${this.apiUrl}/tx/${txid}`);
                await this.cache.set(`tx://${txid}`, rawtx);
                this.requests.delete(txid);
                return rawtx;
            });
            this.requests.set(txid, request);
        }
        return this.requests.get(txid);
    };

    async time(txid: string): Promise<number> {
        const { data: { time } } = await axios(`${this.apiUrl}/tx/${txid}`);
        return time;
    }

    async spends(txid: string, vout: number): Promise<string | null> {
        if (this.debug) console.log('SPENDS:', txid, vout);
        const cacheKey = `spend://${txid}_o${vout}`;
        let spend = await this.cache.get(cacheKey);
        if (spend) return spend;
        const { data: { spendTxId } } = await axios(`${this.apiUrl}/spends/${txid}_o${vout}`);
        if (spendTxId) await this.cache.set(cacheKey, spendTxId);
        return spendTxId;
    }

    async utxos(owner: string, ownerType = 'script', limit = 1000): Promise<IUTXO[]> {
        if (this.debug) console.log('UTXOS:', owner);
        const { data } = await axios(`${this.apiUrl}/utxos/${ownerType}/${owner}?limit=${limit}`);
        return data.map(u => ({
            txid: u.txid,
            vout: u.vout,
            script: u.script,
            satoshis: u.satoshis
        }));
    };

    async utxoCount(script: string): Promise<number> {
        if (this.debug) console.log('UTXOS:', script);
        const { data: { utxoCount } } = await axios(`${this.apiUrl}/utxos/script/${script}/count`);
        return utxoCount;
    };

    async loadParents(rawtx: string): Promise<{ script: string, satoshis: number }[]> {
        const tx = Tx.fromHex(rawtx);
        return Promise.all(tx.txIns.map(async txIn => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = Tx.fromHex(rawtx);
            const txOut = t.txOuts[txIn.txOutNum]
            return { script: txOut.script.toHex(), satoshis: txOut.valueBn.toNumber() };
        }))
    }

    async applyPayments(rawtx, payments: { from: string, amount: number }[], payer?: string, changeSplitSats = 0, satsPerByte = 0.25) {
        const { data } = await axios.post(`${this.apiUrl}/pay`, {
            rawtx, payments, payer, changeSplitSats, satsPerByte
        });

        return data.rawtx;
    }

    async loadJigData(loc: string, unspent = false) {
        const { data } = await axios(`${this.apiUrl}/jigs/${loc}?unspent=${unspent ? 'true' : ''}`);
        return data;
    }

    async jigQuery(query: any) {
        const { data } = await axios.post(`${this.apiUrl}/jigs`, query);
        return data;
    }

    async fund(address: string, satoshis?: number) {
        const { data } = await axios(`${this.apiUrl}/fund/${address}${satoshis ? `?satoshis=${satoshis}` : ''}`);
        return data;
    }

    async balance(script, scriptType = 'address'): Promise<number> {
        const { data: { balance } } = await axios(`${this.apiUrl}/balance/${scriptType}/${script}`)
        return balance;
    }

    async sendMessage(message: SignedMessage, postTo?: string): Promise<any> {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);

        const { data } = await axios.post(url, message);
        return data;
    }
}
