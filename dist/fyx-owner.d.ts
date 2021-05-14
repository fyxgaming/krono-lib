import { KeyPair } from 'bsv';
export declare class FyxOwner {
    apiUrl: string;
    private bip32;
    fyxId: string;
    userId: string;
    private keyPair;
    protected feeAddress: any;
    keyPairs: Map<string, any>;
    private _batonAddress;
    private _paymentAddress;
    pubkey: string;
    constructor(apiUrl: string, bip32: any, fyxId: string, userId: string, keyPair: KeyPair, feeAddress: any);
    get batonAddress(): any;
    get paymentAddress(): any;
    nextOwner(): Promise<any>;
    addDerivations(derivations: string[]): Promise<void>;
    loadDerivations(): Promise<void>;
    sign(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[], locks: any[]): Promise<string>;
    getListingBase(): string;
    getPurchaseBase({ address, satoshis }: {
        address: any;
        satoshis: any;
    }): string;
    signOrderLock(tx: any, script: any, valueBn: any): any;
}
