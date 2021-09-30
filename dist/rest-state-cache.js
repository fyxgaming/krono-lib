"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestStateCache = void 0;
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
class RestStateCache {
    constructor(apiUrl, cache = new Map(), debug = false) {
        this.apiUrl = apiUrl;
        this.cache = cache;
        this.debug = debug;
        this.requests = new Map();
    }
    async get(key) {
        if (this.debug)
            console.log('State:', key);
        if (key.startsWith('ban://') || key.startsWith('trust://'))
            return;
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
                    const resp = await (0, fyx_axios_1.default)(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                    value = resp.data;
                    if (this.debug)
                        console.log('Remote Hit:', key);
                    await this.cache.set(key, value);
                }
                catch (e) {
                    if (e.status !== 404)
                        console.error('State Error:', e);
                }
                this.requests.delete(key);
                return value;
            })();
            this.requests.set(key, request);
        }
        return this.requests.get(key);
    }
    async set(key, value) {
        if (key.startsWith('ban://') || key.startsWith('trust://'))
            return;
        await this.cache.set(key, value);
    }
}
exports.RestStateCache = RestStateCache;
//# sourceMappingURL=rest-state-cache.js.map