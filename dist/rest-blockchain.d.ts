import { Tx } from 'bsv';
import { IBlockchain } from './iblockchain';
import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
export declare class RestBlockchain implements IBlockchain {
    apiUrl: string;
    network: string;
    cache: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    };
    mapiKey?: string;
    protected debug: boolean;
    private requests;
    constructor(apiUrl: string, network: string, cache?: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    }, mapiKey?: string, debug?: boolean);
    get bsvNetwork(): string;
    broadcast(rawtx: any): Promise<any>;
    retrieveOutputs(tx: Tx): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    fetch(txid: string): Promise<any>;
    time(txid: string): Promise<number>;
    spends(txid: string, vout: number): Promise<string | null>;
    utxos(owner: string, ownerType?: string, limit?: number): Promise<IUTXO[]>;
    utxoCount(script: string): Promise<number>;
    loadParents(rawtx: string): Promise<{
        script: string;
        satoshis: number;
    }[]>;
    applyPayments(rawtx: any, payments: {
        from: string;
        amount: number;
    }[], payer?: string, changeSplitSats?: number, satsPerByte?: number): Promise<any>;
    loadJigData(loc: string, unspent?: boolean): Promise<any>;
    jigQuery(query: any): Promise<any>;
    fund(address: string, satoshis?: number): Promise<any>;
    balance(script: any, scriptType?: string): Promise<number>;
    sendMessage(message: SignedMessage, postTo?: string): Promise<any>;
}
