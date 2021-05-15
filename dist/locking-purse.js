"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
const buffer_1 = require("buffer");
const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 149;
const OUTPUT_SIZE = 34;
class LockingPurse {
    constructor(keyPair, blockchain, redis, splits = 10, satsPerByte = 0.5) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.redis = redis;
        this.splits = splits;
        this.satsPerByte = satsPerByte;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }
    async pay(rawtx, parents) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        let size = tx.toBuffer().length;
        let totalIn = 0;
        parents.forEach(({ satoshis }, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer();
            size += (scriptBuf.length > 100 ? 0 : SIG_SIZE);
            totalIn += satoshis;
        }, 0);
        let totalOut = tx.txOuts.reduce((a, { valueBn }) => a + valueBn.toNumber(), 0);
        const inputsToSign = new Map();
        const utxos = await this.blockchain.utxos(this.script.toHex());
        const utxoCount = utxos.length;
        let inputsAdded = 0;
        if (totalIn < totalOut + (size * this.satsPerByte)) {
            while (totalIn < totalOut + (size * this.satsPerByte)) {
                size += INPUT_SIZE;
                const utxo = utxos.pop();
                if (!utxo)
                    break;
                const lockKey = `lock:${utxo.txid}_o${utxo.vout}`;
                if (await this.redis.setnx(lockKey, Date.now())) {
                    await this.redis.expire(lockKey, 120);
                    console.log('UTXO Selected:', lockKey, utxo);
                    inputsToSign.set(tx.txIns.length, utxo);
                    tx.addTxIn(buffer_1.Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
                    inputsAdded++;
                    totalIn += utxo.satoshis;
                    size += INPUT_SIZE;
                }
                else {
                    console.log('UTXO locked:', lockKey);
                }
            }
            if (totalIn < totalOut + (size * this.satsPerByte))
                throw new Error(`Inadequate UTXOs for purse: ${this.address}`);
        }
        console.log('UTXOS:', utxoCount);
        let changeOutputs = Math.max(this.splits - utxoCount + inputsAdded, 1);
        console.log('Change Outputs:', changeOutputs);
        const change = totalIn - totalOut - (size * this.satsPerByte);
        while (changeOutputs > 0) {
            const outputValue = Math.floor((change / changeOutputs) - (OUTPUT_SIZE * this.satsPerByte));
            if (outputValue > DUST_LIMIT) {
                for (let i = 0; i < changeOutputs; i++) {
                    tx.addTxOut(new bsv_1.Bn(outputValue), this.script);
                }
                break;
            }
            changeOutputs--;
        }
        console.log('Final Outputs:', changeOutputs);
        await Promise.all([...inputsToSign.entries()].map(async ([vin, utxo]) => {
            const sig = await tx.asyncSign(this.keyPair, bsv_1.Sig.SIGHASH_ALL | bsv_1.Sig.SIGHASH_FORKID, vin, bsv_1.Script.fromString(utxo.script), new bsv_1.Bn(utxo.satoshis));
            const sigScript = new bsv_1.Script()
                .writeBuffer(sig.toTxFormat())
                .writeBuffer(this.keyPair.pubKey.toBuffer());
            tx.txIns[vin].setScript(sigScript);
        }));
        return tx.toHex();
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