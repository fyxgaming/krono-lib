/// <reference types="node" />
import { KeyPair, Tx, TxOut } from 'bsv';
import { EventEmitter } from 'events';
import { IJig } from './interfaces';
import { SignedMessage } from './signed-message';
export declare class Wallet extends EventEmitter {
    paymail: string;
    private keyPair;
    private blockchain;
    address: string;
    purse: string;
    pubkey: string;
    balance: () => Promise<number>;
    load: (loc: string) => Promise<IJig>;
    createTransaction: () => any;
    loadTransaction: (rawtx: string) => Promise<any>;
    getTxPayload: (rawtx: string) => any;
    ownerPair: KeyPair;
    pursePair: KeyPair;
    timeouts: Map<number, any>;
    constructor(paymail: string, keyPair: KeyPair, run: any);
    get now(): number;
    loadJigIndex(kind?: string, limit?: number, offset?: number): Promise<any>;
    loadJig(loc: string): Promise<IJig | void>;
    loadJigs(): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    buildMessage(messageData: Partial<SignedMessage>, sign?: boolean): SignedMessage;
    signTx(tx: Tx): Promise<TxOut[]>;
    encrypt(pubkey: string): Promise<void>;
    decrypt(value: any): Promise<void>;
    verifySig(sig: any, hash: any, pubkey: any): Promise<boolean>;
    randomInt(max: any): number;
    randomBytes(size: number): string;
    setTimeout(cb: () => Promise<void>, ms: number): number;
    clearTimeout(timeoutId: number): void;
}
