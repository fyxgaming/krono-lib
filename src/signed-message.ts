/**
 * Module signed-message.ts provides functionality for signing and verifying messages.
 * @packageDocumentation
 */

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

    /**
    * Purpose: creates a new SignedMessage object with a fully or partially defined input SignedMessage object
    * 
    */

    constructor(message: Partial<SignedMessage>) {
        Object.assign(this, message);
    }

    /**
    * Purpose: returns a hash of this object's properties
    * 
    */

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

    /**
    * Purpose: returns a string of the hash of this object's properties
    * 
    */

    get id() {
        return this.hash.toString('hex');
    }

    /**
    * Purpose: returns a JSON.parse of this object's payload property
    * 
    */

    get payloadObj() {
        return this.payload && JSON.parse(this.payload);
    }

    /**
    * Purpose: given a collection of a private key and a public key (BSV KeyPair object), sets the sig property of this object
    * by transforming it through an ECDSA signature method
    * 
    */

    sign(keyPair: KeyPair) {
        this.sig = Ecdsa.sign(this.hash, keyPair).toString();
    }

    /**
    * Purpose: verifies the signature held by this object
    * 
    */

    async verify() {
        return Ecdsa.asyncVerify(this.hash, Sig.fromString(this.sig), PubKey.fromString(this.from));
    }
    
}