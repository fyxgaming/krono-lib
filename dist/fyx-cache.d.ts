import { Redis } from "ioredis";
export interface ICache {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
export declare class FyxCache {
    private redis;
    private localCache?;
    private bucket?;
    constructor(redis: Redis, localCache?: ICache, bucket?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
