"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
class RedisCache {
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        let state = await this.redis.get(key);
        if (state)
            return JSON.parse(state);
    }
    async set(key, value) {
        await this.redis.set(key, JSON.stringify(value));
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis-cache.js.map