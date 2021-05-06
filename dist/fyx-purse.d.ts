import { KeyPair } from 'bsv';
import { LockingPurse } from './locking-purse';
import { RestBlockchain } from './rest-blockchain';
export declare class FyxPurse extends LockingPurse {
    protected locks: Map<string, any>;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
