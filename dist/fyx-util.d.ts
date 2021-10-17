import { SignedMessage } from './signed-message';
export interface IUser {
    userId: string;
    pubkey: string;
    xpub: string;
}
export declare class FyxUtil {
    private sql;
    constructor(sql: any);
    loadUser(userId: any): Promise<IUser>;
    validateMessage(message: SignedMessage): Promise<IUser>;
    authAdmin(fyxId: string, message: SignedMessage): Promise<Boolean>;
}
