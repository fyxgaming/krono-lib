export interface ICache {
    get(key: string): Promise<any>;
    set(key:string, value: any): Promise<void>;
}
export class FyxCache {
    constructor(
        private redis, 
        private localCache?: ICache, 
        private bucket = '',
        private aws?: {s3: any}
    ) {}
    async get(key: string) {
        if(key.startsWith('ban://')) return;
        if(this.localCache) {
            const value = await this.localCache.get(key);
            if(value) return value;
        }
        let valueString = await this.redis.get(key);
        if (!valueString && this.bucket && key.startsWith('jig://')) {
            const obj = await this.aws?.s3.getObject({
                Bucket: this.bucket,
                Key: `state/${key}`
            }).promise().catch(e => console.error('GetObject Error:', `state/${key}`, e.message));
            if (obj && obj.Body) {
                valueString = obj.Body.toString('utf8');
                this.redis.set(key, valueString);
            }
        }
        if(valueString) return JSON.parse(valueString);
    }
    async set(key:string, value: any) {
        if(key.startsWith('ban://')) return;
        const valueString = JSON.stringify(value);
        if(this.bucket && key.startsWith('jig://')) {
            await this.aws?.s3.putObject({
                Bucket: this.bucket,
                Key: `state/${key}`,
                Body: valueString
            }).promise();
        }
        await this.redis.set(key, valueString);
        if(this.localCache) {
            await this.localCache.set(key, value);
        }
    }

}

