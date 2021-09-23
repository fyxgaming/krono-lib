"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxPurse = void 0;
const bsv_1 = require("bsv");
const locking_purse_1 = require("./locking-purse");
const order_lock_regex_1 = __importDefault(require("./order-lock-regex"));
class FyxPurse extends locking_purse_1.LockingPurse {
    constructor(keyPair, blockchain, changeSplitSats = 0, satsPerByte = 0.25) {
        super(keyPair, blockchain, changeSplitSats, satsPerByte);
    }
    async pay(rawtx, parents) {
        var _a;
        const tx = bsv_1.Tx.fromHex(rawtx);
        const orderUnlockVout = (_a = parents[0]) === null || _a === void 0 ? void 0 : _a.script.match(order_lock_regex_1.default);
        if (orderUnlockVout) {
            tx.txIns[0].setScript(bsv_1.Script.fromBuffer(Buffer.from(new Array(1568).fill(0))));
            if (tx.txOuts[0].script.isSafeDataOut()) {
                tx.addTxIn(tx.txIns[0].txHashBuf, 0, bsv_1.Script.fromBuffer(Buffer.from(new Array(25).fill(0))), 2 ** 32 - 1);
                const sourceRawTx = await this.blockchain.fetch(Buffer.from(tx.txIns[0].txHashBuf).reverse().toString('hex'));
                const sourceTx = bsv_1.Tx.fromHex(sourceRawTx);
                parents.push({
                    script: sourceTx.txOuts[0].script.toHex(),
                    satoshis: sourceTx.txOuts[0].valueBn.toNumber()
                });
                return super.pay(tx.toHex(), parents);
            }
        }
        return super.pay(tx.toHex(), parents);
    }
}
exports.FyxPurse = FyxPurse;
//# sourceMappingURL=fyx-purse.js.map