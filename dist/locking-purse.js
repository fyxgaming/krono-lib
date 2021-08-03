"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
class LockingPurse {
    constructor(keyPair, blockchain, redis, changeSplitSats = 250000) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.redis = redis;
        this.changeSplitSats = changeSplitSats;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }
    async pay(rawtx, parents) {
        return this.blockchain.applyPayments(rawtx, [], this.address, this.changeSplitSats);
    }
    async utxos() {
        return this.blockchain.utxos(this.script.toHex());
    }
    async balance() {
        return this.blockchain.balance(this.address);
    }
}
exports.LockingPurse = LockingPurse;
//# sourceMappingURL=locking-purse.js.map