"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const bsv_1 = require("bsv");
const events_1 = require("events");
const signed_message_1 = require("./signed-message");
const buffer_1 = require("buffer");
class Wallet extends events_1.EventEmitter {
    constructor(paymail, keyPair, run) {
        super();
        this.paymail = paymail;
        this.keyPair = keyPair;
        this.timeouts = new Map();
        this.blockchain = run.blockchain;
        this.ownerPair = bsv_1.KeyPair.fromPrivKey(bsv_1.PrivKey.fromString(run.owner.privkey));
        this.pursePair = bsv_1.KeyPair.fromPrivKey(bsv_1.PrivKey.fromString(run.purse.privkey));
        this.pubkey = keyPair.pubKey.toHex();
        this.purse = run.purse.address;
        this.address = run.owner.address;
        this.balance = run.purse.balance.bind(run.purse);
        this.load = run.load.bind(run);
        this.createTransaction = () => new run.constructor.Transaction();
        this.loadTransaction = (rawtx) => run.import(rawtx);
        this.getTxPayload = (rawtx) => run.payload(rawtx);
        console.log(`PAYMAIL: ${paymail}`);
        console.log(`PUBKEY: ${keyPair.pubKey.toString()}`);
        console.log(`ADDRESS: ${this.address}`);
        console.log(`PURSE: ${this.purse}`);
    }
    get now() {
        return Date.now();
    }
    async loadJigIndex(kind) {
        return this.blockchain.jigIndex(this.address, kind);
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
    buildMessage(messageData, sign = true) {
        messageData.ts = Date.now();
        messageData.from = this.keyPair.pubKey.toString();
        const message = new signed_message_1.SignedMessage(messageData);
        if (sign)
            message.sign(this.keyPair);
        return message;
    }
    async signTx(tx) {
        return Promise.all(tx.txIns.map(async (txIn, i) => {
            const txid = buffer_1.Buffer.from(txIn.txHashBuf).reverse().toString('hex');
            const outTx = bsv_1.Tx.fromHex(await this.blockchain.fetch(txid));
            const txOut = outTx.txOuts[txIn.txOutNum];
            if (txOut.script.isPubKeyHashOut()) {
                const address = bsv_1.Address.fromTxOutScript(txOut.script).toString();
                if (address === this.purse) {
                    const sig = await tx.asyncSign(this.pursePair, undefined, i, txOut.script, txOut.valueBn);
                    txIn.setScript(new bsv_1.Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.pursePair.pubKey.toBuffer()));
                }
                else if (address === this.address) {
                    const sig = await tx.asyncSign(this.ownerPair, undefined, i, txOut.script, txOut.valueBn);
                    txIn.setScript(new bsv_1.Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.ownerPair.pubKey.toBuffer()));
                }
            }
            return txOut;
        }));
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
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map