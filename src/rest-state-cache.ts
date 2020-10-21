import { IStorage } from './interfaces';

import {HttpError} from './http-error';

export class RestStateCache implements IStorage<any> {
    private requests = new Map<string, Promise<any>>();
    constructor(
        private fetch,
        private apiUrl: string,
        public cache: {get: (key: string) => any, set: (key: string, value: any) => any} = new Map<string, any>(),
        private debug = false
    ) { }

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

    async set(key: string, value: any) {
        await this.cache.set(key, value);
    }
}