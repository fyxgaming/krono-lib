import { KeyPair } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
export declare class LockingPurse {
    keyPair: KeyPair;
    blockchain: RestBlockchain;
    redis: any;
    changeKeyPair?: KeyPair;
    changeThreashold: number;
    satsPerByte: number;
    address: string;
    private script;
    changeAddress?: string;
    private changeScript?;
    constructor(keyPair: KeyPair, blockchain: RestBlockchain, redis: any, changeKeyPair?: KeyPair, changeThreashold?: number, satsPerByte?: number);
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
    utxos(): Promise<any>;
    changeUtxos(): Promise<any>;
    balance(): Promise<number>;
    rebalance(txOutValueTarget?: number): Promise<boolean>;
}
