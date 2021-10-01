"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestBlockchain = void 0;
const bsv_1 = require("bsv");
const buffer_1 = require("buffer");
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
class RestBlockchain {
    constructor(apiUrl, network, cache = new Map(), mapiKey, debug = false) {
        this.apiUrl = apiUrl;
        this.network = network;
        this.cache = cache;
        this.mapiKey = mapiKey;
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
        const { data: { txid } } = await fyx_axios_1.default.post(`${this.apiUrl}/broadcast`, { rawtx, mapiKey: this.mapiKey });
        this.debug && console.log('Broadcast:', txid);
        await this.cache.set(`tx://${txid}`, rawtx);
        return txid;
    }
    async retrieveOutputs(tx) {
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = new bsv_1.Br(txIn.txHashBuf).readReverse().toString('hex');
            const outTx = bsv_1.Tx.fromHex(await this.fetch(txid));
            return {
                location: `${txid}_o${txIn.txOutNum}`,
                script: outTx.txOuts[txIn.txOutNum].script.toString(),
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
                const { data: { rawtx } } = await (0, fyx_axios_1.default)(`${this.apiUrl}/tx/${txid}`);
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
        const { data: { time } } = await (0, fyx_axios_1.default)(`${this.apiUrl}/tx/${txid}`);
        return time;
    }
    async spends(txid, vout) {
        if (this.debug)
            console.log('SPENDS:', txid, vout);
        const cacheKey = `spend://${txid}_o${vout}`;
        let spend = await this.cache.get(cacheKey);
        if (spend)
            return spend;
        const { data: { spendTxId } } = await (0, fyx_axios_1.default)(`${this.apiUrl}/spends/${txid}_o${vout}`);
        if (spendTxId)
            await this.cache.set(cacheKey, spendTxId);
        return spendTxId;
    }
    async utxos(owner, ownerType = 'script', limit = 1000) {
        if (this.debug)
            console.log('UTXOS:', owner);
        const { data } = await (0, fyx_axios_1.default)(`${this.apiUrl}/utxos/${ownerType}/${owner}?limit=${limit}`);
        return data.map(u => ({
            txid: u.txid,
            vout: u.vout,
            script: u.script,
            satoshis: u.satoshis
        }));
    }
    ;
    async utxoCount(script) {
        if (this.debug)
            console.log('UTXOS:', script);
        const { data: { utxoCount } } = await (0, fyx_axios_1.default)(`${this.apiUrl}/utxos/script/${script}/count`);
        return utxoCount;
    }
    ;
    async loadParents(rawtx) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        return Promise.all(tx.txIns.map(async (txIn) => {
            const txid = buffer_1.Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const rawtx = await this.fetch(txid);
            const t = bsv_1.Tx.fromHex(rawtx);
            const txOut = t.txOuts[txIn.txOutNum];
            return { script: txOut.script.toHex(), satoshis: txOut.valueBn.toNumber() };
        }));
    }
    async applyPayments(rawtx, payments, payer, changeSplitSats = 0, satsPerByte = 0.25) {
        const { data } = await fyx_axios_1.default.post(`${this.apiUrl}/pay`, {
            rawtx, payments, payer, changeSplitSats, satsPerByte
        });
        return data.rawtx;
    }
    async loadJigData(loc, unspent = false) {
        const { data } = await (0, fyx_axios_1.default)(`${this.apiUrl}/jigs/${loc}?unspent=${unspent ? 'true' : ''}`);
        return data;
    }
    async jigQuery(query) {
        const { data } = await fyx_axios_1.default.post(`${this.apiUrl}/jigs`, query);
        return data;
    }
    async fund(address, satoshis) {
        const { data } = await (0, fyx_axios_1.default)(`${this.apiUrl}/fund/${address}${satoshis ? `?satoshis=${satoshis}` : ''}`);
        return data;
    }
    async balance(script, scriptType = 'address') {
        const { data: { balance } } = await (0, fyx_axios_1.default)(`${this.apiUrl}/balance/${scriptType}/${script}`);
        return balance;
    }
    async sendMessage(message, postTo) {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);
        const { data } = await fyx_axios_1.default.post(url, message);
        return data;
    }
}
exports.RestBlockchain = RestBlockchain;
//# sourceMappingURL=rest-blockchain.js.map