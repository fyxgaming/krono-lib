"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const bsv_1 = require("bsv");
const events_1 = require("events");
const signed_message_1 = require("./signed-message");
const http_error_1 = require("./http-error");
const buffer_1 = require("buffer");
class Wallet extends events_1.EventEmitter {
    constructor(handle, keyPair, run) {
        super();
        this.handle = handle;
        this.keyPair = keyPair;
        this.timeouts = new Map();
        this.intervals = new Map();
        this.blockchain = run.blockchain;
        // this.ownerPair = KeyPair.fromPrivKey(PrivKey.fromString(run.owner.privkey));
        this.pubkey = keyPair.pubKey.toHex();
        this.address = run.owner.address;
        this.purse = run.purse.address;
        this.load = run.load.bind(run);
        this.createTransaction = () => new run.constructor.Transaction();
        this.loadTransaction = (rawtx) => run.import(rawtx);
        this.getTxPayload = (rawtx) => run.payload(rawtx);
        console.log(`HANDLE: ${handle}`);
        console.log(`PUBKEY: ${keyPair.pubKey.toString()}`);
        console.log(`ADDRESS: ${this.address}`);
        console.log(`PURSE: ${this.purse}`);
    }
    get now() {
        return Date.now();
    }
    async loadJigIndex(query) {
        const resp = await fetch(`${this.blockchain.apiUrl}/jigs/${this.handle}`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(new signed_message_1.SignedMessage({
                payload: JSON.stringify(query)
            }, this.handle, this.keyPair))
        });
        if (!resp.ok)
            throw new http_error_1.HttpError(resp.status, resp.statusText);
        return resp.json();
    }
    async loadJig(loc) {
        const jig = await this.load(loc).catch((e) => {
            if (e.message.match(/not a/i))
                return;
            console.error('Load error:', loc, e.message);
            throw e;
        });
        return jig;
    }
    async loadJigs() {
        const jigIndex = await this.loadJigIndex();
        const jigs = await Promise.all(jigIndex.map(j => this.loadJig(j.location)));
        console.log('JIGS:', jigs.length);
        return jigs;
    }
    buildMessage(messageData) {
        messageData.ts = Date.now();
        const message = new signed_message_1.SignedMessage(messageData, this.handle, this.keyPair);
        return message;
    }
    async encrypt(pubkey) {
    }
    async decrypt(value) {
    }
    async verifySig(sig, hash, pubkey) {
        const msgHash = await bsv_1.Hash.asyncSha256(buffer_1.Buffer.from(hash));
        const verified = bsv_1.Ecdsa.verify(msgHash, bsv_1.Sig.fromString(sig), bsv_1.PubKey.fromString(pubkey));
        console.log('SIG:', verified, sig, hash, pubkey);
        return verified;
    }
    randomInt(max) {
        return Math.floor(Math.random() * (max || Number.MAX_SAFE_INTEGER));
    }
    randomBytes(size) {
        return bsv_1.Random.getRandomBuffer(size).toString('hex');
    }
    setTimeout(cb, ms) {
        const timeoutId = Date.now();
        this.timeouts.set(timeoutId, setTimeout(async () => cb().catch(e => console.error('Timeout Error', e)), ms));
        return timeoutId;
    }
    clearTimeout(timeoutId) {
        if (this.timeouts.has(timeoutId)) {
            clearTimeout(this.timeouts.get(timeoutId));
        }
    }
    setInterval(cb, ms) {
        const intervalId = Date.now();
        this.intervals.set(intervalId, setInterval(async () => cb().catch(e => console.error('Timeout Error', e)), ms));
        return intervalId;
    }
    clearInterval(intervalId) {
        if (this.intervals.has(intervalId)) {
            clearInterval(this.intervals.get(intervalId));
        }
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map