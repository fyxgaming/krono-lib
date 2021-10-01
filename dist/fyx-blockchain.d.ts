import RpcClient from 'bitcoin-core';
import { Redis } from 'ioredis';
import { MongoClient } from "mongodb";
import { IBlockchain } from './iblockchain';
export declare class FyxBlockchain implements IBlockchain {
    network: string;
    private mongo;
    private redis;
    private rpcClient?;
    constructor(network: string, mongo: MongoClient, redis: Redis, rpcClient?: RpcClient);
    broadcast(rawtx: string, mapiKey?: string): Promise<any>;
    fetch(txid: string): Promise<string>;
    utxos(owner: string, ownerType?: string, limit?: number): Promise<any[]>;
    utxoCount(owner: string, ownerType?: string): Promise<number>;
    balance(owner: string, ownerType?: string): Promise<any>;
    spends(txid: string, vout: number | string): Promise<any>;
    time(txid: string): Promise<number>;
    loadParents(rawtx: string): Promise<{
        script: string;
        satoshis: number;
    }[]>;
    loadParentTxOuts(tx: any): Promise<any[]>;
    applyPayment(tx: any, payment: {
        from: string;
        amount: number;
    }, change?: boolean): Promise<{
        inputSats: number;
        inputCount: number;
        outputSats: number;
    }>;
    applyPayments(rawtx: any, payments: {
        from: string;
        amount: number;
    }[], payer?: string, changeSplitSats?: number, satsPerByte?: number): Promise<any>;
}
