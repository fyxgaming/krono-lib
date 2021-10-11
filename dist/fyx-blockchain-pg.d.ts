/// <reference types="node" />
import RpcClient from 'bitcoin-core';
import { Redis } from 'ioredis';
import postgres from 'postgres';
import { IBlockchain } from './iblockchain';
import { FyxCache } from './fyx-cache';
export declare class FyxBlockchainPg implements IBlockchain {
    network: string;
    private sql;
    private redis;
    private cache;
    private rpcClient?;
    constructor(network: string, sql: postgres, redis: Redis, cache: FyxCache, rpcClient?: RpcClient);
    broadcast(rawtx: string, mapiKey?: string): Promise<any>;
    fetch(txid: string): Promise<any>;
    calculateScriptHash(owner: string, ownerType: string): Buffer;
    utxos(owner: string, ownerType?: string, limit?: number): Promise<any>;
    utxoCount(owner: string, ownerType?: string): Promise<any>;
    balance(owner: string, ownerType?: string): Promise<any>;
    spends(txid: string, vout: number | string): Promise<any>;
    time(txid: string): Promise<number>;
    loadParents(rawtx: string): Promise<{
        script: string;
        satoshis: number;
    }[]>;
    loadParentTxOuts(tx: any): Promise<any[]>;
    findAndLockUtxo(scripthash: Buffer): Promise<{
        txid: Buffer;
        vout: number;
        satoshis: number;
    }>;
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
