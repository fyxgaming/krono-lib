import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
export declare class RestBlockchain {
    private fetchLib;
    private apiUrl;
    network: string;
    cache: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    };
    private debug;
    private requests;
    constructor(fetchLib: any, apiUrl: string, network: string, cache?: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    }, debug?: boolean);
    get bsvNetwork(): string;
    broadcast(rawtx: any): Promise<any>;
    populateInputs(tx: any): Promise<void>;
    fetch(txid: string): Promise<any>;
    time(txid: string): Promise<number>;
    spends(txid: string, vout: number): Promise<string | null>;
    utxos(script: string): Promise<IUTXO[]>;
    jigIndex(address: any): Promise<any>;
    loadJigData(loc: string, unspent: boolean): Promise<any>;
    jigQuery(query: any, limit?: number): Promise<any>;
    fund(address: string, satoshis?: number): Promise<any>;
    loadMessage(messageId: any): Promise<SignedMessage>;
    sendMessage(message: SignedMessage, postTo?: string): Promise<void>;
}
