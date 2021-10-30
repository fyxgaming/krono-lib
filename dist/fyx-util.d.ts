import { SignedMessage } from './signed-message';
import { Pool } from 'pg';
export interface IUser {
    userId: string;
    pubkey: string;
    xpub: string;
}
export declare class FyxUtil {
    private pool;
    constructor(pool: Pool);
    loadUser(userId: any): Promise<IUser>;
    validateMessage(message: SignedMessage): Promise<IUser>;
    authAdmin(fyxId: string, message: SignedMessage): Promise<Boolean>;
}
