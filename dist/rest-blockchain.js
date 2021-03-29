import { Br, Tx } from 'bsv';
import axios from './fyx-axios';
export class RestBlockchain {
    constructor(apiUrl, network, cache = new Map(), debug = false) {
        this.apiUrl = apiUrl;
        this.network = network;
        this.cache = cache;
        this.debug = debug;
        this.requests = new Map();
    }
    get bsvNetwork() {
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
        if (this.debug)
            console.log('BROADCAST:', rawtx);
        const { data: { txid } } = await axios.post(`${this.apiUrl}/broadcast`, { rawtx });
        this.debug && console.log('Broadcast:', txid);
        await this.cache.set(`tx://${txid}`, rawtx);
        return txid;
    }
    async retrieveOutputs(tx) {
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = new Br(txIn.txHashBuf).readReverse().toString('hex');
            const outTx = Tx.fromHex(await this.fetch(txid));
            return {
                location: `${txid}_o${txIn.txOutNum}`,
                script: outTx.toOuts[txIn.txOutNum].script.toString(),
            };
        }));
    }
    async fetch(txid) {
        if (this.debug)
            console.log('FETCH:', txid);
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx)
            return rawtx;
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
    }
    ;
    async time(txid) {
        const { data: { time } } = await axios(`${this.apiUrl}/tx/${txid}`);
        return time;
    }
    async spends(txid, vout) {
        if (this.debug)
            console.log('SPENDS:', txid, vout);
        const cacheKey = `spend://${txid}_${vout}`;
        let spend = await this.cache.get(cacheKey);
        if (spend)
            return spend;
        if (!this.requests.has(cacheKey)) {
            const request = (async () => {
                const { data: { spendTxId } } = await axios(`${this.apiUrl}/spends/${txid}_o${vout}`);
                if (spendTxId)
                    await this.cache.set(cacheKey, spendTxId);
                this.requests.delete(cacheKey);
                return spendTxId;
            })();
            this.requests.set(cacheKey, request);
        }
        return this.requests.get(cacheKey);
    }
    async utxos(script, limit = 1000) {
        if (this.debug)
            console.log('UTXOS:', script);
        const { data } = await axios(`${this.apiUrl}/utxos/script/${script}?limit=${limit}`);
        return data;
    }
    ;
    async loadJigData(loc, unspent = false) {
        const { data } = await axios(`${this.apiUrl}/jigs/${loc}?unspent=${unspent ? 'true' : ''}`);
        return data;
    }
    async jigQuery(query) {
        const { data } = await axios.post(`${this.apiUrl}/jigs`, query);
        return data;
    }
    async fund(address, satoshis) {
        const { data } = await axios(`${this.apiUrl}/fund/${address}${satoshis ? `?satoshis=${satoshis}` : ''}`);
        return data;
    }
    async sendMessage(message, postTo) {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);
        const { data } = await axios.post(url, message);
        return data;
    }
}
//# sourceMappingURL=rest-blockchain.js.map