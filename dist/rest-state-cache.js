import { HttpError } from './http-error';
import fetch from 'node-fetch';
export class RestStateCache {
    constructor(apiUrl, cache = new Map(), debug = false) {
        this.apiUrl = apiUrl;
        this.cache = cache;
        this.debug = debug;
        this.requests = new Map();
    }
    async get(key) {
        if (this.debug)
            console.log('State:', key);
        let value = await this.cache.get(key);
        if (value) {
            if (this.debug)
                console.log('Cache Hit:', key);
            return value;
        }
        if (!this.requests.has(key)) {
            const request = (async () => {
                const resp = await fetch(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                if (!resp.ok) {
                    if (resp.status === 404) {
                        if (this.debug)
                            console.log('Remote Miss:', key);
                        return;
                    }
                    throw new HttpError(resp.status, resp.statusText);
                }
                if (this.debug)
                    console.log('Remote Hit:', key);
                value = await resp.json();
                await this.cache.set(key, value);
                this.requests.delete(key);
                return value;
            })();
            this.requests.set(key, request);
        }
        return this.requests.get(key);
    }
    async set(key, value) {
        await this.cache.set(key, value);
    }
}
//# sourceMappingURL=rest-state-cache.js.map