import { SignedMessage } from './signed-message';
import { HttpError } from './http-error';
import fetch from 'node-fetch';
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
        const resp = await fetch(`${this.apiUrl}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawtx })
        });
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        const txid = await resp.text();
        this.debug && console.log('Broadcast:', txid);
        await this.cache.set(`tx://${txid}`, rawtx);
        return txid;
    }
    async populateInputs(tx) {
        await Promise.all(tx.inputs.map(async (input) => {
            const outTx = await this.fetch(input.prevTxId.toString('hex'));
            input.output = outTx.outputs[input.outputIndex];
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
                const resp = await fetch(`${this.apiUrl}/tx/${txid}`);
                if (!resp.ok)
                    throw new HttpError(resp.status, await resp.text());
                rawtx = await resp.text();
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
        return Date.now();
        // const resp = await fetch(`${this.apiUrl}/tx/${txid}`);
        // if (resp.ok) {
        //     const {time} = await resp.json();
        //     await this.cache.set(`tx://${txid}`, rawtx);
        //     break;
        // }
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
                const resp = await fetch(`${this.apiUrl}/spends/${txid}_o${vout}`);
                if (!resp.ok)
                    throw new HttpError(resp.status, await resp.text());
                spend = (await resp.text()) || null;
                if (spend)
                    await this.cache.set(cacheKey, spend);
                this.requests.delete(cacheKey);
                return spend;
            })();
            this.requests.set(cacheKey, request);
        }
        return this.requests.get(cacheKey);
    }
    async utxos(script) {
        if (this.debug)
            console.log('UTXOS:', script);
        const resp = await fetch(`${this.apiUrl}/utxos/${script}`);
        if (!resp.ok)
            throw new Error(await resp.text());
        return resp.json();
    }
    ;
    async jigIndex(address) {
        const resp = await fetch(`${this.apiUrl}/jigs/address/${address}`);
        if (!resp.ok)
            throw new Error(`${resp.status} ${resp.statusText}`);
        return resp.json();
    }
    async loadJigData(loc, unspent) {
        const resp = await fetch(`${this.apiUrl}/jigs/${loc}${unspent && '?unspent'}`);
        if (!resp.ok)
            throw new Error(`${resp.status} ${resp.statusText}`);
        return resp.json();
    }
    async kindHistory(kind, query) {
        const resp = await fetch(`${this.apiUrl}/jigs/kind/${kind}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        return resp.json();
    }
    async originHistory(origin, query) {
        const resp = await fetch(`${this.apiUrl}/jigs/origin/${origin}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        return resp.json();
    }
    async fund(address, satoshis) {
        const resp = await fetch(`${this.apiUrl}/fund/${address}${satoshis ? `?satoshis=${satoshis}` : ''}`);
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        return resp.text();
    }
    async loadMessage(messageId) {
        const resp = await fetch(`${this.apiUrl}/messages/${messageId}`);
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        return new SignedMessage(await resp.json());
    }
    async sendMessage(message, postTo) {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(message)
        });
        if (!resp.ok)
            throw new HttpError(resp.status, await resp.text());
        return resp.json();
    }
}
//# sourceMappingURL=rest-blockchain.js.map