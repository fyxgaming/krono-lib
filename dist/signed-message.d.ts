import { KeyPair } from 'bsv';
export declare class SignedMessage {
    from: string;
    to: string[];
    reply: string;
    subject: string;
    context: string[];
    payload: string;
    ts: number;
    sig?: string;
    constructor(message: Partial<SignedMessage>, keyPair?: KeyPair);
    get hash(): any;
    get id(): any;
    get payloadObj(): any;
    sign(keyPair: KeyPair): void;
    verify(): Promise<any>;
}
