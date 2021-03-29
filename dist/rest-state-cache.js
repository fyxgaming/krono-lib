import axios from './fyx-axios';
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
                let value;
                try {
                    const resp = await axios(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                    value = resp.data;
                    if (this.debug)
                        console.log('Remote Hit:', key);
                    await this.cache.set(key, value);
                }
                catch (e) {
                    if (e.status !== 404)
                        throw e;
                    if (this.debug)
                        console.log('Remote Miss:', key);
                }
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