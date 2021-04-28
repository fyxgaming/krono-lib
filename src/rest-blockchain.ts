import { Br, Tx } from 'bsv';
import axios from './fyx-axios';
import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
export class RestBlockchain {
    private requests = new Map<string, Promise<any>>();
    constructor(
        public apiUrl: string,
        public network: string,
        public cache: { get: (key: string) => any, set: (key: string, value: any) => any } = new Map<string, any>(),
        protected debug = false
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
        const { data: { txid } } = await axios.post(`${this.apiUrl}/broadcast`, { rawtx })
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
        const cacheKey = `spend://${txid}_${vout}`;
        let spend = await this.cache.get(cacheKey);
        if (spend) return spend;
        if (!this.requests.has(cacheKey)) {
            const request = (async () => {
                const { data: { spendTxId } } = await axios(`${this.apiUrl}/spends/${txid}_o${vout}`);
                if (spendTxId) await this.cache.set(cacheKey, spendTxId);
                this.requests.delete(cacheKey);
                return spendTxId;
            })();
            this.requests.set(cacheKey, request);
        }
        return this.requests.get(cacheKey);
    }

    async utxos(script: string, limit: number = 1000): Promise<IUTXO[]> {
        if (this.debug) console.log('UTXOS:', script);
        const { data } = await axios(`${this.apiUrl}/utxos/script/${script}?limit=${limit}`);
        return data.map(u => ({
            txid: u.txid,
            vout: u.vout,
            script: u.script,
            satoshis: u.satoshis
        }));
    };

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

    async sendMessage(message: SignedMessage, postTo?: string): Promise<any> {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);
        
        const { data } = await axios.post(url, message);
        return data;
    }
}
