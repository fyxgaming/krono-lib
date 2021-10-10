import { Redis } from "ioredis";
export declare class FyxCache {
    private bucket;
    private redis;
    constructor(bucket: string, redis: Redis);
    get(key: any): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
