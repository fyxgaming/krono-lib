/**
 * Module wallet.ts implements a wallet
 * @packageDocumentation
 */

import { Address, Ecdsa, Hash, KeyPair, PrivKey, PubKey, Random, Script, Sig, Tx, TxOut } from 'bsv';
import { EventEmitter } from 'events';
import { RestBlockchain } from './rest-blockchain';
import { IJig } from './interfaces';
import { SignedMessage } from './signed-message';
import { Buffer } from 'buffer';

export class Wallet extends EventEmitter {
    private blockchain: RestBlockchain;
    address: string;
    purse: string;
    pubkey: string;
    balance: () => Promise<number>
    load: (loc: string) => Promise<IJig>;
    createTransaction: () => any;
    loadTransaction: (rawtx: string) => Promise<any>;
    getTxPayload: (rawtx: string) => any;

    ownerPair: KeyPair;
    pursePair: KeyPair;

    timeouts = new Map<number, any>();

    /**
    * Purpose: creates a wallet using a paymail and a KeyPair object, and a reference to a RUN instance
    * 
    * Example: 
    *   const paymail = `${run.owner.address}@localhost`;
    *   const keyPair = KeyPair.fromPrivKey(PrivKey.fromString(owner));
    *   const run = new Run({
    *        network: 'testnet',
    *        blockchain,
    *        owner,
    *        purse,
    *        state: new LRUCache(100000000)
    *   });
    * 
    */

    constructor(
        public paymail: string,
        private keyPair: KeyPair,
        run: any
    ) {
        super();
        this.blockchain = run.blockchain;
        this.ownerPair = KeyPair.fromPrivKey(PrivKey.fromString(run.owner.privkey));
        this.pursePair = KeyPair.fromPrivKey(PrivKey.fromString(run.purse.privkey));
        this.pubkey = keyPair.pubKey.toHex();
        this.purse = run.purse.address;
        this.address = run.owner.address;
        this.balance = run.purse.balance.bind(run.purse);
        this.load = run.load.bind(run);
        this.createTransaction = () => new run.constructor.Transaction();
        this.loadTransaction = (rawtx: string) => run.import(rawtx);
        this.getTxPayload = (rawtx: string) => run.payload(rawtx);

        console.log(`PAYMAIL: ${paymail}`);
        console.log(`PUBKEY: ${keyPair.pubKey.toString()}`);
        console.log(`ADDRESS: ${this.address}`);
        console.log(`PURSE: ${this.purse}`);
    }

    /**
    * Purpose: returns the current date in milliseconds since epoch (see https://currentmillis.com/ for milliseconds since epoch information)
    * 
    */

    get now() {
        return Date.now();
    }

    /**
    * Purpose: returns the JIGs associated with this wallet's address. Any data filtering options can be supplied as input parameters.
    * 
    * Invokes RestBlockchain.jigIndex
    */

    async loadJigIndex(kind = '', limit = 100, offset = 0, includeValue = true) {
        return this.blockchain.jigIndex(this.address, kind, limit, offset, includeValue);
    }

    /**
    * Purpose: loads and returns a JIG associated with a specific location string.
    * 
    */

    async loadJig(loc: string): Promise<IJig | void> {
        const jig = await this.load(loc).catch((e) => {
            if (e.message.match(/not a/i)) return;
            console.error('Load error:', loc, e.message);
            throw e;
        });
        return jig;
    }

    /**
    * Purpose: loads and returns all the JIGs associated with this wallet's address.
    * 
    */

    async loadJigs() {
        const jigIndex = await this.loadJigIndex();
        const jigs = await Promise.all(jigIndex.map(j => this.loadJig(j.location)))
        console.log('JIGS:', jigs.length);
        return jigs;
    }

    /**
    * Purpose: builds a signed message from a given input message.
    * 
    */

    buildMessage(messageData: Partial<SignedMessage>, sign = true): SignedMessage {
        messageData.ts = Date.now();
        messageData.from = this.keyPair.pubKey.toString();
        const message = new SignedMessage(messageData);
        if (sign) message.sign(this.keyPair);
        return message;
    }

    /**
    * Purpose: signs an input transaction and returns the signed form of the input transaction.
    * 
    */

    async signTx(tx: Tx): Promise<TxOut[]> {
        return Promise.all(tx.txIns.map(async (txIn, i) => {
            const txid = Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const outTx = Tx.fromHex(await this.blockchain.fetch(txid));
            const txOut = outTx.txOuts[txIn.txOutNum];
            if (txOut.script.isPubKeyHashOut()) {
                const address = Address.fromTxOutScript(txOut.script).toString();
                if (address === this.purse) {
                    const sig = await tx.asyncSign(this.pursePair, undefined, i, txOut.script, txOut.valueBn);
                    txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.pursePair.pubKey.toBuffer()));
                } else if (address === this.address) {
                    const sig = await tx.asyncSign(this.ownerPair, undefined, i, txOut.script, txOut.valueBn);
                    txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.ownerPair.pubKey.toBuffer()));
                }
            }
            return txOut;
        }));
    }

    /**
    * Purpose: Reserved for a future implementation.
    * 
    */

    async encrypt(pubkey: string) {

    }

    /**
    * Purpose: Reserved for a future implementation.
    * 
    */

    async decrypt(value) {

    }

    /**
    * Purpose: given a signature, hash of a transaction and a public key, verifies that the signature on the transaction hash is valid.
    * 
    */

    async verifySig(sig, hash, pubkey): Promise<boolean> {
        const msgHash = await Hash.asyncSha256(Buffer.from(hash));
        const verified = Ecdsa.verify(msgHash, Sig.fromString(sig), PubKey.fromString(pubkey));
        console.log('SIG:', verified, sig, hash, pubkey);
        return verified;
    }

    /**
    * Purpose: generates a random integer given an upper limit.
    * 
    */

    randomInt(max) {
        return Math.floor(Math.random() * (max || Number.MAX_SAFE_INTEGER));
    }

    /**
    * Purpose: generates a random bytes buffer of a given input size.
    * 
    */

    randomBytes(size: number): string {
        return Random.getRandomBuffer(size).toString('hex');
    }

    /**
    * Purpose: given a callback and milliseconds as input, creates a timeout ID and waits for the input milliseconds and returns the timeout ID.
    * This reimplements Node.js setTimeout method. Both the ID and the timeout output are stored to a map for audit purposes.
    * 
    */

    setTimeout(cb: () => Promise<void>, ms: number): number {
        const timeoutId = Date.now();
        this.timeouts.set(
            timeoutId,
            setTimeout(async () => cb().catch(e => console.error('Timeout Error', e)), ms)
        );
        return timeoutId;
    }

    /**
    * Purpose: given a timeout ID, clears it from the stored map of timeouts.
    * 
    */

    clearTimeout(timeoutId: number): void {
        if (this.timeouts.has(timeoutId)) {
            clearTimeout(this.timeouts.get(timeoutId));
        }
    }

    // async cashout(address) {
    //     const utxos = await this.blockchain.utxos(this.run.purse.address);
    //     const tx = new Transaction()
    //         .from(utxos)
    //         .change(address)
    //         .sign(this.run.purse.privkey);
    //     await this.blockchain.broadcast(tx);
    //     // this.clientEmit('BalanceUpdated', await this.balance);
    // }
}
