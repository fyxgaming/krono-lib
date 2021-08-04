import { KeyPair } from 'bsv';
import { LockingPurse } from './locking-purse';
import { RestBlockchain } from './rest-blockchain';
export declare class FyxPurse extends LockingPurse {
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, changeSplitSats?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
