"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedMessage = void 0;
const bsv_1 = require("bsv");
const buffer_1 = require("buffer");
const MAGIC_BYTES = buffer_1.Buffer.from('Bitcoin Signed Message:\n');
const MAGIC_BYTES_PREFIX = bsv_1.Bw.varIntBufNum(MAGIC_BYTES.length);
class SignedMessage {
    constructor(message = {}, userId, keyPair) {
        this.from = '';
        this.to = [];
        this.reply = '';
        this.subject = '';
        this.context = [];
        this.payload = '';
        this.ts = Date.now();
        Object.assign(this, message);
        if (keyPair)
            this.sign(userId, keyPair);
    }
    get hash() {
        const payloadBuf = buffer_1.Buffer.concat([
            buffer_1.Buffer.from(this.to.join(':')),
            buffer_1.Buffer.from(this.reply || ''),
            buffer_1.Buffer.from(this.subject),
            buffer_1.Buffer.from(this.context.join(':')),
            bsv_1.Bw.varIntBufNum(this.ts),
            buffer_1.Buffer.from(this.payload || '')
        ]);
        const messageBuf = buffer_1.Buffer.concat([
            MAGIC_BYTES_PREFIX,
            MAGIC_BYTES,
            bsv_1.Bw.varIntBufNum(payloadBuf.length),
            payloadBuf
        ]);
        return bsv_1.Hash.sha256Sha256(messageBuf);
    }
    get id() {
        return this.hash.toString('hex');
    }
    get payloadObj() {
        return this.payload && JSON.parse(this.payload);
    }
    sign(userId, keyPair) {
        this.from = userId;
        this.ts = Date.now();
        this.sig = bsv_1.Ecdsa.sign(this.hash, keyPair).toString();
    }
    async verify(pubkey) {
        if (typeof pubkey === 'string') {
            pubkey = bsv_1.PubKey.fromString(pubkey);
        }
        return bsv_1.Ecdsa.asyncVerify(this.hash, bsv_1.Sig.fromString(this.sig), pubkey);
    }
}
exports.SignedMessage = SignedMessage;
//# sourceMappingURL=signed-message.js.map