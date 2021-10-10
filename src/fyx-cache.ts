
import * as AWS from 'aws-sdk';
import { Redis } from "ioredis";

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

export class FyxCache {
    constructor(private redis: Redis, private bucket?: string) {}
    async get(key) {
        if(key.startsWith('ban://')) return;
        let value = await this.redis.get(key);
        if (!value && this.bucket) {
            const obj = await s3.getObject({
                Bucket: this.bucket,
                Key: `state/${key}`
            }).promise().catch(e => console.error('GetObject Error:', `state/${key}`, e.message));
            if (obj && obj.Body) {
                value = obj.Body.toString('utf8');
                this.redis.set(key, value);
            }
        }
        if(value) return JSON.parse(value);

    }
    async set(key :string, value) {
        if(key.startsWith('ban://')) return;
        const valueString = JSON.stringify(value);
        if(this.bucket) {
            await s3.putObject({
                Bucket: this.bucket,
                Key: `state/${key}`,
                Body: valueString
            }).promise();
        }
        await this.redis.set(key, valueString);
    }

}

