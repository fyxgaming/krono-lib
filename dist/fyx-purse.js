"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxPurse = exports.UtxoLock = void 0;
const bsv_1 = require("bsv");
// import Run from 'run-sdk'
const locking_purse_1 = require("./locking-purse");
const order_lock_regex_1 = __importDefault(require("./order-lock-regex"));
// export class FyxPurse extends Run.plugins.LocalPurse {
class UtxoLock {
    constructor() {
        this.locks = new Map();
    }
    async setnx(key, value) {
        if (this.locks.has(key))
            return 0;
        this.locks.set(key, value);
        return 1;
    }
    async expire(key, seconds) {
        setTimeout(() => this.locks.delete(key), seconds * 1000);
    }
}
exports.UtxoLock = UtxoLock;
class FyxPurse extends locking_purse_1.LockingPurse {
    constructor(keyPair, blockchain, changeKeyPair, changeThreashold = 10000, satsPerByte = 0.5) {
        super(keyPair, blockchain, new UtxoLock(), changeKeyPair, changeThreashold, satsPerByte);
    }
    async pay(rawtx, parents) {
        var _a;
        const tx = bsv_1.Tx.fromHex(rawtx);
        const orderUnlockVout = (_a = parents[0]) === null || _a === void 0 ? void 0 : _a.script.match(order_lock_regex_1.default);
        if (orderUnlockVout) {
            tx.txIns[0].setScript(bsv_1.Script.fromBuffer(Buffer.from(new Array(1568).fill(0))));
            if (tx.txOuts[0].script.isSafeDataOut()) {
                tx.addTxIn(tx.txIns[0].txHashBuf, 0, bsv_1.Script.fromBuffer(Buffer.from(new Array(25).fill(0))), 2 ** 32 - 1);
                return tx.toHex();
            }
        }
        return super.pay(rawtx, parents);
    }
}
exports.FyxPurse = FyxPurse;
//# sourceMappingURL=fyx-purse.js.map