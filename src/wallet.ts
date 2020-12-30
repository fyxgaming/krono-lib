import { Address, Ecdsa, Hash, KeyPair, PrivKey, PubKey, Random, Script, Sig, Tx, TxOut } from 'bsv';
import { EventEmitter } from 'events';
import { RestBlockchain } from './rest-blockchain';
import { IJig, IJigQuery } from './interfaces';
import { SignedMessage } from './signed-message';
import { Buffer } from 'buffer';

export class Wallet extends EventEmitter {
    private blockchain: RestBlockchain;
    address: string;
    pubkey: string;
    balance: () => Promise<number>
    load: (loc: string) => Promise<IJig>;
    createTransaction: () => any;
    loadTransaction: (rawtx: string) => Promise<any>;
    getTxPayload: (rawtx: string) => any;

    ownerPair: KeyPair;

    timeouts = new Map<number, any>();

    constructor(
        public paymail: string,
        private keyPair: KeyPair,
        run: any
    ) {
        super();
        this.blockchain = run.blockchain;
        this.ownerPair = KeyPair.fromPrivKey(PrivKey.fromString(run.owner.privkey));
        this.pubkey = keyPair.pubKey.toHex();
        this.address = run.owner.address;
        this.load = run.load.bind(run);
        this.createTransaction = () => new run.constructor.Transaction();
        this.loadTransaction = (rawtx: string) => run.import(rawtx);
        this.getTxPayload = (rawtx: string) => run.payload(rawtx);

        console.log(`PAYMAIL: ${paymail}`);
        console.log(`PUBKEY: ${keyPair.pubKey.toString()}`);
        console.log(`ADDRESS: ${this.address}`);
    }

    get now() {
        return Date.now();
    }

    async loadJigIndex(query?: IJigQuery) {
        return this.blockchain.jigIndex(this.address, query);
    }

    async loadJig(loc: string): Promise<IJig | void> {
        const jig = await this.load(loc).catch((e) => {
            if (e.message.match(/not a/i)) return;
            console.error('Load error:', loc, e.message);
            throw e;
        });
        return jig;
    }

    async loadJigs() {
        const jigIndex = await this.loadJigIndex();
        const jigs = await Promise.all(jigIndex.map(j => this.loadJig(j.location)))
        console.log('JIGS:', jigs.length);
        return jigs;
    }

    buildMessage(messageData: Partial<SignedMessage>, sign = true): SignedMessage {
        messageData.ts = Date.now();
        messageData.from = this.keyPair.pubKey.toString();
        const message = new SignedMessage(messageData);
        if (sign) message.sign(this.keyPair);
        return message;
    }

    async encrypt(pubkey: string) {

    }

    async decrypt(value) {

    }

    async verifySig(sig, hash, pubkey): Promise<boolean> {
        const msgHash = await Hash.asyncSha256(Buffer.from(hash));
        const verified = Ecdsa.verify(msgHash, Sig.fromString(sig), PubKey.fromString(pubkey));
        console.log('SIG:', verified, sig, hash, pubkey);
        return verified;
    }

    randomInt(max) {
        return Math.floor(Math.random() * (max || Number.MAX_SAFE_INTEGER));
    }

    randomBytes(size: number): string {
        return Random.getRandomBuffer(size).toString('hex');
    }

    setTimeout(cb: () => Promise<void>, ms: number): number {
        const timeoutId = Date.now();
        this.timeouts.set(
            timeoutId,
            setTimeout(async () => cb().catch(e => console.error('Timeout Error', e)), ms)
        );
        return timeoutId;
    }

    clearTimeout(timeoutId: number): void {
        if (this.timeouts.has(timeoutId)) {
            clearTimeout(this.timeouts.get(timeoutId));
        }
    }
}
