"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxUtil = void 0;
const bsv_1 = require("bsv");
const http_errors_1 = __importDefault(require("http-errors"));
class FyxUtil {
    constructor(pool) {
        this.pool = pool;
    }
    async loadUser(userId) {
        userId = userId.toLowerCase().normalize('NFKC');
        const { rows: [user] } = await this.pool.query(`SELECT id, encode(pubkey, 'hex') as pubkey, xpub 
            FROM users WHERE id=$1`, [userId]);
        if (!user)
            throw new http_errors_1.default.NotFound();
        return {
            userId: user.id,
            pubkey: user.pubkey,
            xpub: user.xpub
        };
    }
    async validateMessage(message) {
        console.log('MSG:', JSON.stringify(message));
        // VALIDATE TIMESTAMP
        const timecheck = Date.now();
        if (Math.abs(timecheck - message.ts) > (1000 * 60 * 5)) {
            throw new http_errors_1.default.Forbidden('Invalid Timestamp');
        }
        const user = await this.loadUser(message.from);
        if (!user)
            throw new http_errors_1.default.Forbidden();
        if (!await message.verify(bsv_1.PubKey.fromString(user.pubkey))) {
            throw new http_errors_1.default.Forbidden('Invalid Signature');
        }
        return user;
    }
    async authAdmin(fyxId, message) {
        let user = await this.validateMessage(message);
        const { rows: [count] } = await this.pool.query(`SELECT count(*) as count FROM client_admins
            WHERE fyx_id=$1 AND user_id=$2`, [fyxId, user.userId]);
        return !!count;
    }
}
exports.FyxUtil = FyxUtil;
//# sourceMappingURL=fyx-util.js.map