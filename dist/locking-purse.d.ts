import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class LockingPurse {
    private keyPair;
    private blockchain;
    private redis;
    private changeAddress?;
    private recycleThreashold;
    address: string;
    private script;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, redis: any, changeAddress?: string, recycleThreashold?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
