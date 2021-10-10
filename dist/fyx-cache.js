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
    constructor(bucket, redis) {
        this.bucket = bucket;
        this.redis = redis;
    }
    async get(key) {
        if (key.startsWith('ban://'))
            return;
        let value = await this.redis.get(key);
        if (!value) {
            const obj = await s3.getObject({
                Bucket: this.bucket,
                Key: `state/${key}`
            }).promise().catch(e => console.error('GetObject Error:', `state/${key}`, e.message));
            if (obj && obj.Body) {
                value = obj.Body.toString('utf8');
                this.redis.set(key, value);
            }
        }
        if (value)
            return JSON.parse(value);
    }
    async set(key, value) {
        if (key.startsWith('ban://'))
            return;
        const valueString = JSON.stringify(value);
        await s3.putObject({
            Bucket: this.bucket,
            Key: `state/${key}`,
            Body: valueString
        }).promise();
        await this.redis.set(key, valueString);
    }
}
exports.FyxCache = FyxCache;
//# sourceMappingURL=fyx-cache.js.map