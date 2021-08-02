import axios from './fyx-axios';
import { IStorage } from './interfaces';
export class RestStateCache implements IStorage<any> {
    private requests = new Map<string, Promise<any>>();
    constructor(
        private apiUrl: string,
        public cache: {get: (key: string) => any, set: (key: string, value: any) => any} = new Map<string, any>(),
        private debug = false
    ) { }

    async get(key: string): Promise<any> {
        if(this.debug) console.log('State:', key);
        if(key.startsWith('ban://') || key.startsWith('trust://')) return;
        let value = await this.cache.get(key);
        if (value) {
            if(this.debug) console.log('Cache Hit:', key);
            return value;
        }

        if (!this.requests.has(key)) {
            const request = (async () => {
                let value;
                try {
                    const resp = await axios(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                    value = resp.data;
                    if(this.debug) console.log('Remote Hit:', key);
                    await this.cache.set(key, value);
                } catch (e) {
                    if(e.status !== 404) console.error('State Error:', e)
                }
                this.requests.delete(key);
                return value;
            })();
            this.requests.set(key, request);
        }
        return this.requests.get(key);
    }

    async set(key: string, value: any) {
        if(key.startsWith('ban://') || key.startsWith('trust://')) return;
        await this.cache.set(key, value);
    }
}