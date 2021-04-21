"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingPurse = void 0;
const bsv_1 = require("bsv");
const order_lock_regex_1 = __importDefault(require("./order-lock-regex"));
const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
class LockingPurse {
    constructor(keyPair, blockchain, satsPerByte = 0.5, debug = true) {
        this.keyPair = keyPair;
        this.blockchain = blockchain;
        this.satsPerByte = satsPerByte;
        this.debug = debug;
        const address = bsv_1.Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }
    async pay(rawtx, parents) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        const orderUnlockVout = parents[0].script.match(order_lock_regex_1.default);
        if (orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, bsv_1.Script.fromString('OP_0 OP_0'), 2 ** 32 - 1);
            return tx.toHex();
        }
        ;
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
                if (this.debug)
                    console.log('UTXO Selected:', utxo);
                inputsToSign.set(tx.txIns.length, utxo);
                tx.addTxIn(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, bsv_1.Script.fromString('OP_0 OP_0'), bsv_1.TxIn.SEQUENCE_FINAL);
                totalIn += utxo.satoshis;
                size += INPUT_SIZE;
            }
            if (totalIn < totalOut + (size * this.satsPerByte))
                throw new Error(`Inadequate UTXOs for purse: ${this.address}`);
        }
        const change = totalIn - totalOut - ((size + OUTPUT_SIZE) * this.satsPerByte);
        if (change > DUST_LIMIT) {
            tx.addTxOut(new bsv_1.Bn(change), this.script);
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
}
exports.LockingPurse = LockingPurse;
//# sourceMappingURL=fyx-purse.js.map