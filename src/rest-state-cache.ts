/**
 * Module rest-state-cache.ts provides a local cache associated with the data in the RUN maintained local cache
 * @packageDocumentation
 */

import { IStorage } from './interfaces';

import {HttpError} from './http-error';

export class RestStateCache implements IStorage<any> {
    private requests = new Map<string, Promise<any>>();

    /**
    * Purpose: creates a new RestStateCache object with a fetch library handle, a URL that points to the blockchain data and
    * a handle to the local RUN cache. The input parameters are stored as private variables for later reference.
    * 
    */

    constructor(
        private fetch,
        private apiUrl: string,
        public cache: {get: (key: string) => any, set: (key: string, value: any) => any} = new Map<string, any>(),
        private debug = false
    ) { }

    /**
    * Purpose: given a cache key, returns the value associated with the key from the RestStateCache object
    * 
    */

    async get(key: string): Promise<any> {
        if(this.debug) console.log('State:', key);
        let value = await this.cache.get(key);
        if (value) {
            if(this.debug) console.log('Cache Hit:', key);
            return value;
        }

        if (!this.requests.has(key)) {
            const request = (async () => {
                const resp = await this.fetch(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                if (!resp.ok) {
                    if (resp.status === 404) {
                        if(this.debug) console.log('Remote Miss:', key);
                        return;
                    }
                    throw new HttpError(resp.status, resp.statusText);
                }
                if(this.debug) console.log('Remote Hit:', key);
                value = await resp.json();
                await this.cache.set(key, value);
                this.requests.delete(key);
                return value;

            })();
            this.requests.set(key, request);
        }
        return this.requests.get(key);
    }

    /**
    * Purpose: given a key and value input parameters, sets up a key-value pair based map in the RestStateCache object.
    * 
    */

    async set(key: string, value: any) {
        await this.cache.set(key, value);
    }
}