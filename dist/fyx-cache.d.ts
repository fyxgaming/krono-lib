export interface ICache {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
export declare class FyxCache {
    private redis;
    private localCache?;
    private bucket;
    private aws?;
    constructor(redis: any, localCache?: ICache, bucket?: string, aws?: {
        s3: any;
    });
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
