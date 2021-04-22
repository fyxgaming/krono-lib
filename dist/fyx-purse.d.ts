import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class FyxPurse {
    private keyPair;
    private blockchain;
    satsPerByte: number;
    debug: boolean;
    address: string;
    private script;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, satsPerByte?: number, debug?: boolean);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
    balance(): Promise<number>;
}
