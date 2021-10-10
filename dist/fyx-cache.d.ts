import { Redis } from "ioredis";
export declare class FyxCache {
    private redis;
    private localCache?;
    private bucket?;
    constructor(redis: Redis, localCache?: any, bucket?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
