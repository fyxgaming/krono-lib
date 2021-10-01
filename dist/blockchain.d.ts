import { IUTXO } from "./interfaces";
export declare abstract class Blockchain {
    network: string;
    abstract broadcast(rawtx: string): Promise<string>;
    abstract fetch(txid: string): Promise<string>;
    abstract utxos(owner: string, ownerType: string, limit: number): Promise<IUTXO>;
    abstract utxoCount(script: string): Promise<number>;
    abstract spends(txid: string, vout: number | string): Promise<string>;
}
