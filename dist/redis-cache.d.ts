import { Redis } from "ioredis";
export declare class RedisCache {
    private redis;
    constructor(redis: Redis);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
