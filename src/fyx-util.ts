import { PubKey } from 'bsv';
import createError from 'http-errors';
import { SignedMessage } from './signed-message';
export interface IUser {
    userId: string;
    pubkey: string;
    xpub: string;
}

export class FyxUtil {
    constructor(private sql) { }

    async loadUser(userId): Promise<IUser> {
        userId = userId.toLowerCase().normalize('NFKC');
        const [user] = await this.sql`SELECT id, encode(pubkey, 'hex') as pubkey, xpub 
            FROM users WHERE id=${userId}`;

        if (!user) throw new createError.NotFound();
        return {
            userId: user.id,
            pubkey: user.pubkey,
            xpub: user.xpub
        };
    }

    async validateMessage(message: SignedMessage): Promise<IUser> {
        console.log('MSG:', JSON.stringify(message));
        // VALIDATE TIMESTAMP
        const timecheck = Date.now();
        if (Math.abs(timecheck - message.ts) > (1000 * 60 * 5)) {
            throw new createError.Forbidden('Invalid Timestamp');
        }

        const user = await this.loadUser(message.from);
        if (!user) throw new createError.Forbidden();
        if (!await message.verify(PubKey.fromString(user.pubkey))) {
            throw new createError.Forbidden('Invalid Signature');
        }

        return user;
    }

    async authAdmin(fyxId: string, message: SignedMessage): Promise<Boolean> {
        let user = await this.validateMessage(message);

        const rows = await this.sql`SELECT count(*) as count FROM client_admins
            WHERE fyx_id=${fyxId} AND user_id=${user.userId}`;
        
        return !!rows.count;
    }
}
