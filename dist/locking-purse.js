"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
class LockingPurse {
    constructor(keyPair, blockchain, redis, changeKeyPair, changeThreashold = 10000, satsPerByte = 0.5) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.redis = redis;
        this.changeKeyPair = changeKeyPair;
        this.changeThreashold = changeThreashold;
        this.satsPerByte = satsPerByte;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
        if (changeKeyPair) {
            const changeAddress = bsv_1.Address.fromPrivKey(changeKeyPair.privKey);
            this.changeAddress = changeAddress.toString();
            this.changeScript = changeAddress.toTxOutScript();
        }
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
        if (totalIn < totalOut + (size * this.satsPerByte)) {
            const utxos = await this.blockchain.utxos(this.script.toHex(), 50);
            while (totalIn < totalOut + (size * this.satsPerByte)) {
                size += INPUT_SIZE;
                const utxo = utxos.pop();
                if (!utxo)
                    break;
                const lockKey = `lock:${utxo.txid}_o${utxo.vout}`;
                if (await this.redis.setnx(lockKey, Date.now())) {
                    await this.redis.expire(lockKey, 60);
                    console.log('UTXO Selected:', lockKey, utxo);
                    inputsToSign.set(tx.txIns.length, utxo);
                    tx.addTxIn(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
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
        const change = totalIn - totalOut - ((size + OUTPUT_SIZE) * this.satsPerByte);
        if (change > DUST_LIMIT) {
            const script = this.changeScript && change < this.changeThreashold ?
                this.changeScript :
                this.script;
            tx.addTxOut(new bsv_1.Bn(change), script);
        }
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
    async changeUtxos() {
        if (!this.changeScript)
            return [];
        return this.blockchain.utxos(this.changeScript.toHex());
    }
    async balance() {
        const balance = (await this.blockchain.balance(this.address)) +
            (this.changeAddress ? await this.blockchain.balance(this.changeAddress) : 0);
        return balance;
    }
}
exports.LockingPurse = LockingPurse;
//# sourceMappingURL=locking-purse.js.map