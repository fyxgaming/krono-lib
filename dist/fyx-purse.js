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
        var _a;
        const tx = bsv_1.Tx.fromHex(rawtx);
        const orderUnlockVout = (_a = parents[0]) === null || _a === void 0 ? void 0 : _a.script.match(order_lock_regex_1.default);
        if (orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, bsv_1.Script.fromString('OP_0 OP_0'), 2 ** 32 - 1);
            // const txid = Buffer.from(tx.txIns[0].txHashBuf).reverse().toString('hex');
            // const lockRawTx = await this.blockchain.fetch(txid);
            // const lockTx = Tx.fromString(lockRawTx);
            // rawtx = tx.toHex();
            // parents.push({
            //     script: lockTx.txOuts[0].script.toHex(),
            //     satoshis: lockTx.txOuts[0].valueBn.toNumber()
            // })
            return tx.toHex();
        }
        ;
        return super.pay(rawtx, parents);
    }
}
exports.FyxPurse = FyxPurse;
//# sourceMappingURL=fyx-purse.js.map