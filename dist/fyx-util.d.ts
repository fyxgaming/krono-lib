import { SignedMessage } from './signed-message';
import postgres from 'postgres';
export interface IUser {
    userId: string;
    pubkey: string;
    xpub: string;
    verified: Date;
}
export declare class Util {
    private sql;
    constructor(sql: postgres);
    loadUser(userId: any): Promise<IUser>;
    validateMessage(message: SignedMessage): Promise<IUser>;
    authAdmin(fyxId: string, message: SignedMessage): Promise<Boolean>;
}
