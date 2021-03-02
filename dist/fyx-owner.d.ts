export declare class FyxOwner {
    apiUrl: string;
    private userId;
    private bip32;
    fyxId: string;
    derivations: string[];
    constructor(apiUrl: string, userId: string, bip32: any, fyxId: string);
    nextOwner(): Promise<any>;
    sign(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[], locks: any[]): Promise<string>;
}
