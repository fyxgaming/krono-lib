import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class LockingPurse {
    keyPair: KeyPair;
    blockchain: RestBlockchain;
    changeSplitSats: number;
    address: string;
    private script;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, changeSplitSats?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<string>;
    utxos(): Promise<any>;
    balance(): Promise<number>;
    utxoCount(): Promise<number>;
}
