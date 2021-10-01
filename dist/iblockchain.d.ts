import { IUTXO } from "./interfaces";
export interface IBlockchain {
    broadcast(rawtx: string): Promise<string>;
    network: string;
    broadcast(rawtx: any): Promise<any>;
    fetch(txid: string): Promise<any>;
    time(txid: string): Promise<number>;
    spends(txid: string, vout: number): Promise<string | null>;
    utxos(script: string, ownerType?: string, limit?: number): Promise<IUTXO[]>;
    utxoCount(script: string): Promise<number>;
    loadParents(rawtx: string): Promise<{
        script: string;
        satoshis: number;
    }[]>;
    applyPayments(rawtx: any, payments: {
        from: string;
        amount: number;
    }[], payer?: string, changeSplitSats?: number, satsPerByte?: number): Promise<any>;
    balance(script: any, scriptType?: string): Promise<number>;
}
