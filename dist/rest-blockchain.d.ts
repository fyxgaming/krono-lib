import { IUTXO } from './interfaces';
import { SignedMessage } from './signed-message';
export declare class RestBlockchain {
    private apiUrl;
    network: string;
    cache: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    };
    private debug;
    private requests;
    constructor(apiUrl: string, network: string, cache?: {
        get: (key: string) => any;
        set: (key: string, value: any) => any;
    }, debug?: boolean);
    get bsvNetwork(): string;
    broadcast(rawtx: any): Promise<string>;
    populateInputs(tx: any): Promise<void>;
    fetch(txid: string): Promise<any>;
    time(txid: string): Promise<number>;
    spends(txid: string, vout: number): Promise<string | null>;
    utxos(script: string): Promise<IUTXO[]>;
    jigIndex(address: any): Promise<any>;
    loadJigData(loc: string, unspent: boolean): Promise<any>;
    kindHistory(kind: string, query: any): Promise<any>;
    originHistory(origin: string, query: any): Promise<any>;
    fund(address: string, satoshis?: number): Promise<string>;
    loadMessage(messageId: any): Promise<SignedMessage>;
    sendMessage(message: SignedMessage, postTo?: string): Promise<void>;
}
