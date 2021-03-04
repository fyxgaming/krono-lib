import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
import { Tx } from 'bsv';
export declare class RestBlockchain {
    protected fetchLib: any;
    apiUrl: string;
    network: string;
    cache: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    };
    protected debug: boolean;
    private requests;
    constructor(fetchLib: any, apiUrl: string, network: string, cache?: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    }, debug?: boolean);
    get bsvNetwork(): string;
    broadcast(rawtx: any): Promise<any>;
    retrieveOutputs(tx: Tx): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    fetch(txid: string): Promise<any>;
    time(txid: string): Promise<number>;
    spends(txid: string, vout: number): Promise<string | null>;
    utxos(script: string, limit?: number): Promise<IUTXO[]>;
    loadJigData(loc: string, unspent?: boolean): Promise<any>;
    jigQuery(query: any): Promise<any>;
    fund(address: string, satoshis?: number): Promise<any>;
    loadMessage(messageId: any): Promise<SignedMessage>;
    sendMessage(message: SignedMessage, postTo?: string): Promise<any>;
}
