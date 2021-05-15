import { KeyPair } from 'bsv';
import { LockingPurse } from './locking-purse';
import { RestBlockchain } from './rest-blockchain';
export declare class UtxoLock {
    protected locks: Map<string, any>;
    setnx(key: string, value: any): Promise<0 | 1>;
    expire(key: string, seconds: any): Promise<void>;
}
export declare class FyxPurse extends LockingPurse {
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, splits?: number, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
