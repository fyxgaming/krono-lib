import { KeyPair } from '@ts-bitcoin/core';
export declare class FyxOwner {
    apiUrl: string;
    private bip32;
    fyxId: string;
    keyPairs: Map<string, KeyPair>;
    constructor(apiUrl: string, bip32: any, fyxId: string);
    nextOwner(): Promise<string>;
    sign(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[], locks: any[]): Promise<string>;
    addDerivations(derivations: string[]): Promise<void>;
}
