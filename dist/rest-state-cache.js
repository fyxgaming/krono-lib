"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestStateCache = void 0;
const http_error_1 = require("./http-error");
const node_fetch_1 = __importDefault(require("node-fetch"));
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
        let value = await this.cache.get(key);
        if (value) {
            if (this.debug)
                console.log('Cache Hit:', key);
            return value;
        }
        if (!this.requests.has(key)) {
            const request = (async () => {
                const resp = await node_fetch_1.default(`${this.apiUrl}/state/${encodeURIComponent(key)}`);
                if (!resp.ok) {
                    if (resp.status === 404) {
                        if (this.debug)
                            console.log('Remote Miss:', key);
                        return;
                    }
                    throw new http_error_1.HttpError(resp.status, resp.statusText);
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
exports.RestStateCache = RestStateCache;
//# sourceMappingURL=rest-state-cache.js.map