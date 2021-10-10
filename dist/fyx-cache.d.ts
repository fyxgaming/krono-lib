import { Redis } from "ioredis";
export declare class FyxCache {
    private redis;
    private bucket?;
    constructor(redis: Redis, bucket?: string);
    get(key: any): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
