import Run from 'run-sdk';
import { RestBlockchain } from './rest-blockchain';
export declare class FyxPurse extends Run.plugins.LocalPurse {
    blockchain: RestBlockchain;
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
