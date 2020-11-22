/**
 * Module rest-blockchain.ts provides a REST based implementation of the RUN BSV Blockchain
 * @packageDocumentation
 */


import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';

import { HttpError } from './http-error';

export class RestBlockchain {
    private requests = new Map<string, Promise<any>>();

    /**
    * Purpose: creates a new RestBlockchain object with a fetch library handle, a URL that points to the blockchain data, the network name and
    * a handle to the local RUN cache. The input parameters are stored as private variables for later reference.
    * 
    */

    constructor(
        private fetchLib,
        private apiUrl: string,
        public network: string,
        public cache: { get: (key: string) => any, set: (key: string, value: any) => any } = new Map<string, any>(),
        private debug = false
    ) { }

    /**
    * Purpose: returns a string indicating whether the current network is mainnet, testnet or a different network
    * 
    */

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

    /**
    * Purpose: broadcasts a raw transaction to the blockchain
    * 
    */

    async broadcast(rawtx) {
        if (this.debug) console.log('BROADCAST:', rawtx);
        const resp = await this.fetchLib(`${this.apiUrl}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawtx })
        });
        if (!resp.ok) throw new HttpError(resp.status, await resp.text());
        const txid = await resp.text();
        this.debug && console.log('Broadcast:', txid);
        await this.cache.set(`tx://${txid}`, rawtx);
        return txid;
    }

    /**
    * Purpose: given a transaction object, populates the inputs property of this transaction object 
    * with the outputs of the previous transaction
    * 
    */

    async populateInputs(tx) {
        await Promise.all(tx.inputs.map(async input => {
            const outTx = await this.fetch(input.prevTxId.toString('hex'));
            input.output = outTx.outputs[input.outputIndex];
        }));
    }

    /**
    * Purpose: given a transaction ID, returns the raw transaction associated with it. The raw transaction is 
    * either retrieved from cache (if present) or is fetched by making a request for the raw transaction associated
    * with this transaction ID.
    * 
    */

    async fetch(txid: string) {
        if (this.debug) console.log('FETCH:', txid);
        let rawtx = await this.cache.get(`tx://${txid}`);
        if (rawtx) return rawtx;
        if (!this.requests.has(txid)) {
            const request = Promise.resolve().then(async () => {
                const resp = await this.fetchLib(`${this.apiUrl}/tx/${txid}`);
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
    };

    /**
    * Purpose: returns the current time
    * 
    */

    async time(txid: string): Promise<number> {
        return Date.now();
        // const resp = await this.fetchLib(`${this.apiUrl}/tx/${txid}`);
        // if (resp.ok) {
        //     const {time} = await resp.json();
        //     await this.cache.set(`tx://${txid}`, rawtx);
        //     break;
        // }
    }

    /**
    * Purpose: given a transaction ID and an output number, returns the spent amount associated with it. The raw transaction is 
    * either retrieved from cache (if present) or is fetched by making a request for the raw transaction associated
    * with this transaction ID and output number.
    * 
    */

    async spends(txid: string, vout: number): Promise<string | null> {
        if (this.debug) console.log('SPENDS:', txid, vout);
        const cacheKey = `spend://${txid}_${vout}`;
        let spend = await this.cache.get(cacheKey);
        if (spend) return spend;
        if (!this.requests.has(cacheKey)) {
            const request = (async () => {
                const resp = await this.fetchLib(`${this.apiUrl}/spends/${txid}_o${vout}`);
                if (!resp.ok) throw new HttpError(resp.status, await resp.text());
                spend = (await resp.text()) || null;
                if (spend) await this.cache.set(cacheKey, spend);
                this.requests.delete(cacheKey);
                return spend;
            })();
            this.requests.set(cacheKey, request);
        }
        return this.requests.get(cacheKey);
    }

    /**
    * Purpose: returns the Unspent Transaction Outputs (UTXOs) associated with the given input script.
    * 
    */

    async utxos(script: string): Promise<IUTXO[]> {
        if (this.debug) console.log('UTXOS:', script);
        const resp = await this.fetchLib(`${this.apiUrl}/utxos/${script}`);
        if (!resp.ok) throw new Error(await resp.text());
        return resp.json();
    };

    /**
    * Purpose: returns the JIGs associated with an address based with the ability to filter the response data
    * based on input parameters. 
    * 
    * Default output: returns up to 100 JIGs of all kinds along with their values
    * 
    */

    async jigIndex(address: string, kind = '', limit = 100, offset = 0, includeValue = true) {
        const url = `${this.apiUrl}/jigs/address/${address}?limit=${limit}&offset=${offset}&kind=${kind || ''}${!includeValue ? '&trim=true' : ''}`;
        const resp = await this.fetchLib(url);
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        return resp.json();
    }

    /**
    * Purpose: given a location, returns JIG data associated with that location. The unspent flag controls whether
    * this method should only return unspent data or all of it. 
    *  
    */

    async loadJigData(loc: string, unspent: boolean) {
        const resp = await this.fetchLib(`${this.apiUrl}/jigs/${loc}${unspent && '?unspent'}`);
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        return resp.json();
    }

    /**
    * Purpose: given a query object, the JIGs associated with the query input parameters.
    * 
    * Example: const jigData = await blockchain.jigQuery({kind: location}, 10); 
    *  
    */

    async jigQuery(query: any, limit = 10) {
        const resp = await this.fetchLib(`${this.apiUrl}/jigs/search?limit=${limit}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        if (!resp.ok) throw new HttpError(resp.status, await resp.text());
        return resp.json();
    }

    /**
    * Purpose: given a wallet address, funds the address with the given satoshi value
    * 
    */

    async fund(address: string, satoshis?: number) {
        const resp = await this.fetchLib(`${this.apiUrl}/fund/${address}${satoshis ? `?satoshis=${satoshis}` : ''}`);
        if (!resp.ok) throw new HttpError(resp.status, await resp.text());
        return resp.text();
    }

    /**
    * Purpose: returns a signed message associated with the given messageId
    * 
    */

    async loadMessage(messageId): Promise<SignedMessage> {
        const resp = await this.fetchLib(`${this.apiUrl}/messages/${messageId}`);
        if (!resp.ok) throw new HttpError(resp.status, await resp.text());
        return new SignedMessage(await resp.json());
    }

    /**
    * Purpose: sends a signed message to the URL path provided by the postTo parm. 
    * If postTo is ommitted, the message is delivered to the generic /messages path
    * 
    */

    async sendMessage(message: SignedMessage, postTo?: string): Promise<any> {
        const url = postTo || `${this.apiUrl}/messages`;
        console.log('Post TO:', url);
        const resp = await this.fetchLib(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(message)
        });
        if (!resp.ok) throw new HttpError(resp.status, await resp.text());
        return resp.json();
    }
}
