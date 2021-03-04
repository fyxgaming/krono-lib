import { KeyPair } from 'bsv';
export declare class FyxOwner {
    apiUrl: string;
    private userId;
    private keyPair;
    private bip32;
    fyxId: string;
    derivations: string[];
    constructor(apiUrl: string, userId: string, keyPair: KeyPair, bip32: any, fyxId: string);
    nextOwner(): Promise<any>;
    sign(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[], locks: any[]): Promise<string>;
}
