import { Bw, Ecdsa, Hash, KeyPair, PubKey, Sig } from 'bsv';
import { Buffer } from 'buffer';
const MAGIC_BYTES = Buffer.from('Bitcoin Signed Message:\n');
const MAGIC_BYTES_PREFIX = Bw.varIntBufNum(MAGIC_BYTES.length);

export class SignedMessage {
    from: string = '';
    to: string[] = [];
    reply: string = '';
    subject: string = '';
    context: string[] = [];
    payload: string = '';
    ts: number = Date.now();
    sig?: string;

    constructor(message: Partial<SignedMessage> = {}, userId?: string, keyPair?: KeyPair) {
        Object.assign(this, message);
        if(keyPair) this.sign(userId, keyPair);
    }

    get hash() {
        const payloadBuf = Buffer.concat([
            Buffer.from(this.to.join(':')),
            Buffer.from(this.reply || ''),
            Buffer.from(this.subject),
            Buffer.from(this.context.join(':')),
            Bw.varIntBufNum(this.ts),
            Buffer.from(this.payload || '')
        ]);
        const messageBuf = Buffer.concat([
            MAGIC_BYTES_PREFIX,
            MAGIC_BYTES,
            Bw.varIntBufNum(payloadBuf.length),
            payloadBuf
        ]);
        return Hash.sha256Sha256(messageBuf);
    }

    get id() {
        return this.hash.toString('hex');
    }

    get payloadObj() {
        return this.payload && JSON.parse(this.payload);
    }

    sign(userId: string, keyPair: KeyPair) {
        this.from = userId;
        this.ts = Date.now();
        this.sig = Ecdsa.sign(this.hash, keyPair).toString();
    }

    async verify(pubkey: PubKey | string) {
        if(typeof pubkey === 'string') {
            pubkey = PubKey.fromString(pubkey);
        }
        return Ecdsa.asyncVerify(this.hash, Sig.fromString(this.sig), pubkey);
    }
    
}