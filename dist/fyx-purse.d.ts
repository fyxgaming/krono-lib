import { KeyPair } from 'bsv';
import { IBlockchain } from './iblockchain';
import { LockingPurse } from './locking-purse';
export declare class FyxPurse extends LockingPurse {
    constructor(keyPair: KeyPair, blockchain: IBlockchain, changeSplitSats?: number, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<string>;
}
