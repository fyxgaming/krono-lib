export declare class FyxOwner {
    apiUrl: string;
    private bip32;
    fyxId: string;
    private keyPairs;
    constructor(apiUrl: string, bip32: any, fyxId: string);
    nextOwner(): Promise<any>;
    sign(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[], locks: any[]): Promise<string>;
    addDerivations(derivations: string[]): Promise<void>;
}
