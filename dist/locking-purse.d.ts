import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class LockingPurse {
    keyPair: KeyPair;
    blockchain: RestBlockchain;
    redis: any;
    splits: number;
    satsPerByte: number;
    address: string;
    private script;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, redis: any, splits?: number, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
    utxos(): Promise<any>;
    balance(): Promise<number>;
}
