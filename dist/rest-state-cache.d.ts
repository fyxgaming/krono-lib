import { IStorage } from './interfaces';
export declare class RestStateCache implements IStorage<any> {
    private apiUrl;
    cache: Map<string, any>;
    private debug;
    private requests;
    constructor(apiUrl: string, cache?: Map<string, any>, debug?: boolean);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
