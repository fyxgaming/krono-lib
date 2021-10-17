"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxCache = void 0;
class FyxCache {
    constructor(redis, localCache, bucket = '', aws) {
        this.redis = redis;
        this.localCache = localCache;
        this.bucket = bucket;
        this.aws = aws;
    }
    async get(key) {
        var _a;
        if (key.startsWith('ban://'))
            return;
        if (this.localCache) {
            const value = await this.localCache.get(key);
            if (value)
                return value;
        }
        let valueString = await this.redis.get(key);
        if (!valueString && this.bucket && key.startsWith('jig://')) {
            const obj = await ((_a = this.aws) === null || _a === void 0 ? void 0 : _a.s3.getObject({
                Bucket: this.bucket,
                Key: `state/${key}`
            }).promise().catch(e => console.error('GetObject Error:', `state/${key}`, e.message)));
            if (obj && obj.Body) {
                valueString = obj.Body.toString('utf8');
                this.redis.set(key, valueString);
            }
        }
        if (valueString)
            return JSON.parse(valueString);
    }
    async set(key, value) {
        var _a;
        if (key.startsWith('ban://'))
            return;
        const valueString = JSON.stringify(value);
        if (this.bucket && key.startsWith('jig://')) {
            await ((_a = this.aws) === null || _a === void 0 ? void 0 : _a.s3.putObject({
                Bucket: this.bucket,
                Key: `state/${key}`,
                Body: valueString
            }).promise());
        }
        await this.redis.set(key, valueString);
        if (this.localCache) {
            await this.localCache.set(key, value);
        }
    }
}
exports.FyxCache = FyxCache;
//# sourceMappingURL=fyx-cache.js.map