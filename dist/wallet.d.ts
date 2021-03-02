/// <reference types="node" />
import { KeyPair } from 'bsv';
import { EventEmitter } from 'events';
import { IJig, IJigQuery } from './interfaces';
import { SignedMessage } from './signed-message';
export declare class Wallet extends EventEmitter {
    handle: string;
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
    timeouts: Map<number, any>;
    intervals: Map<number, any>;
    constructor(handle: string, keyPair: KeyPair, run: any);
    get now(): number;
    loadJigIndex(query?: IJigQuery): Promise<any>;
    loadJig(loc: string): Promise<IJig | void>;
    loadJigs(): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    buildMessage(messageData: Partial<SignedMessage>): SignedMessage;
    encrypt(pubkey: string): Promise<void>;
    decrypt(value: any): Promise<void>;
    verifySig(sig: any, hash: any, pubkey: any): Promise<boolean>;
    randomInt(max: any): number;
    randomBytes(size: number): string;
    setTimeout(cb: () => Promise<void>, ms: number): number;
    clearTimeout(timeoutId: number): void;
    setInterval(cb: () => Promise<void>, ms: number): number;
    clearInterval(intervalId: number): void;
}
