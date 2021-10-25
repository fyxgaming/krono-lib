"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
class LockingPurse {
    constructor(keyPair, blockchain, changeSplitSats = 250000, satsPerByte = 0.25) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.changeSplitSats = changeSplitSats;
        this.satsPerByte = satsPerByte;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript().toHex();
        this.address = address.toString();
    }
    async pay(rawtx, parents) {
        rawtx = await this.blockchain.applyPayments(rawtx, [], this.address, this.changeSplitSats, this.satsPerByte);
        parents = await this.blockchain.loadParents(rawtx);
        const tx = bsv_1.Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const { script, satoshis } = parents[i];
            if (script !== this.script)
                return;
            const lockScript = bsv_1.Script.fromHex(script);
            const txOut = bsv_1.TxOut.fromProperties(new bsv_1.Bn(satoshis), lockScript);
            const sig = await tx.asyncSign(this.keyPair, bsv_1.Sig.SIGHASH_ALL | bsv_1.Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
            txIn.setScript(new bsv_1.Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.keyPair.pubKey.toBuffer()));
        }));
        return tx.toHex();
    }
    async utxos() {
        const utxos = await this.blockchain.utxos(this.script);
        return utxos.map(u => ({
            ...u,
            script: this.script
        }));
    }
    async balance() {
        return this.blockchain.balance(this.address);
    }
    async utxoCount() {
        return this.blockchain.utxoCount(this.script);
    }
}
exports.LockingPurse = LockingPurse;
//# sourceMappingURL=locking-purse.js.map