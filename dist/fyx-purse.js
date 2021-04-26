"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxPurse = void 0;
const bsv_1 = require("bsv");
const run_sdk_1 = __importDefault(require("run-sdk"));
const order_lock_regex_1 = __importDefault(require("./order-lock-regex"));
class FyxPurse extends run_sdk_1.default.plugins.LocalPurse {
    async pay(rawtx, parents) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        const orderUnlockVout = parents[0].script.match(order_lock_regex_1.default);
        if (orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, bsv_1.Script.fromString('OP_0 OP_0'), 2 ** 32 - 1);
            return tx.toHex();
        }
        ;
        return super.pay(rawtx, parents);
    }
}
exports.FyxPurse = FyxPurse;
//# sourceMappingURL=fyx-purse.js.map