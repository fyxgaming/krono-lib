import { IStorage } from './interfaces';
export declare class RestStateCache implements IStorage<any> {
    private apiUrl;
    cache: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    };
    private debug;
    private requests;
    constructor(apiUrl: string, cache?: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    }, debug?: boolean);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
