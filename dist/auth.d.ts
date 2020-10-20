/// <reference types="node" />
import { KeyPair } from 'bsv';
export declare class KronoAuth {
    private apiUrl;
    domain: string;
    private network;
    constructor(apiUrl: string, domain: string, network: string);
    createKey(handle: any, password: any): Promise<Buffer>;
    register(handle: string, password: string, email: string): Promise<string>;
    login(handle: string, password: string): Promise<string>;
    recover(paymail: string, keyPair: KeyPair): Promise<any>;
    isHandleAvailable(handle: string): Promise<boolean>;
}
