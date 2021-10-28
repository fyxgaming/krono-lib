/// <reference types="node" />
import { KeyPair, PubKey } from 'bsv';
export declare class SignedMessage {
    from: string;
    to: string[];
    reply: string;
    subject: string;
    context: string[];
    payload: string;
    ts: number;
    sig?: string;
    constructor(message?: Partial<SignedMessage>, userId?: string, keyPair?: KeyPair);
    get hash(): Buffer;
    get id(): string;
    get payloadObj(): any;
    sign(userId: string, keyPair: KeyPair): void;
    verify(pubkey: PubKey | string): Promise<any>;
}
