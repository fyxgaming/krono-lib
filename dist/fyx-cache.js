"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxCache = void 0;
const AWS = __importStar(require("aws-sdk"));
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
class FyxCache {
    constructor(redis, localCache, bucket) {
        this.redis = redis;
        this.localCache = localCache;
        this.bucket = bucket;
    }
    async get(key) {
        if (key.startsWith('ban://'))
            return;
        if (this.localCache) {
            const value = await this.localCache.get(key);
            if (value)
                return value;
        }
        let valueString = await this.redis.get(key);
        if (!valueString && this.bucket && key.startsWith('jig://')) {
            const obj = await s3.getObject({
                Bucket: this.bucket,
                Key: `state/${key}`
            }).promise().catch(e => console.error('GetObject Error:', `state/${key}`, e.message));
            if (obj && obj.Body) {
                valueString = obj.Body.toString('utf8');
                this.redis.set(key, valueString);
            }
        }
        if (valueString)
            return JSON.parse(valueString);
    }
    async set(key, value) {
        if (key.startsWith('ban://'))
            return;
        const valueString = JSON.stringify(value);
        if (this.bucket && key.startsWith('jig://')) {
            await s3.putObject({
                Bucket: this.bucket,
                Key: `state/${key}`,
                Body: valueString
            }).promise();
        }
        await this.redis.set(key, valueString);
        if (this.localCache) {
            await this.localCache.set(key, value);
        }
    }
}
exports.FyxCache = FyxCache;
//# sourceMappingURL=fyx-cache.js.map