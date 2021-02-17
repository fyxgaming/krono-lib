"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
class LockingPurse {
    constructor(keyPair, blockchain, redis, changeAddress, satsPerByte = 0.25, recycleThreashold = 50000) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.redis = redis;
        this.changeAddress = changeAddress;
        this.satsPerByte = satsPerByte;
        this.recycleThreashold = recycleThreashold;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }
    async pay(rawtx, parents) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        let fee = Math.ceil(rawtx.length / 2 * this.satsPerByte);
        let totalIn = parents.reduce((a, { satoshis }) => a + satoshis, 0);
        const totalOut = tx.txOuts.reduce((a, { valueBn }) => a + valueBn.toNumber(), 0);
        if (totalIn >= totalOut + fee)
            return rawtx;
        fee += Math.ceil(((rawtx.length / 2) + 160) * this.satsPerByte);
        const utxos = await this.blockchain.utxos(this.script.toHex(), 25);
        let utxo;
        for (const u of utxos) {
            const lockKey = `lock:${u.txid}_o${u.vout}`;
            if (await this.redis.setnx(lockKey, Date.now())) {
                await this.redis.expire(lockKey, 60);
                console.log('UTXO Selected:', lockKey, utxo);
                utxo = u;
                break;
            }
            else {
                console.log('UTXO locked:', lockKey);
            }
        }
        if (!utxo)
            throw new Error(`No UTXOs found for purse: ${this.address}`);
        tx.addTxIn(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
        totalIn += utxo.satoshis;
        const change = totalIn - totalOut - fee;
        const changeScript = (!this.changeAddress || change > this.recycleThreashold) ?
            this.script :
            bsv_1.Address.fromString(this.changeAddress).toTxOutScript();
        tx.addTxOut(bsv_1.Bn(change), changeScript);
        const sig = await tx.asyncSign(this.keyPair, undefined, tx.txIns.length - 1, bsv_1.Script.fromString(utxo.script), bsv_1.Bn(utxo.satoshis));
        const sigScript = new bsv_1.Script()
            .writeBuffer(sig.toTxFormat())
            .writeBuffer(this.keyPair.pubKey.toBuffer());
        tx.txIns[tx.txIns.length - 1].setScript(sigScript);
        return tx.toHex();
    }
}
exports.LockingPurse = LockingPurse;
//# sourceMappingURL=locking-purse.js.map