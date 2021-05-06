import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class LockingPurse {
    protected keyPair: KeyPair;
    protected blockchain: RestBlockchain;
    protected redis: any;
    satsPerByte: number;
    address: string;
    private script;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, redis: any, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
