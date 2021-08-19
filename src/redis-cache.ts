import { Redis } from "ioredis";

export class RedisCache {
    constructor(private redis: Redis) {}

    async get(key: string) {
        let state = await this.redis.get(key);
        if(state) return JSON.parse(state);
    }

    async set(key: string, value: any) {
        await this.redis.set(key, JSON.stringify(value));
    }
}