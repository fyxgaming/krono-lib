"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxOwner = void 0;
const axios_1 = __importDefault(require("axios"));
const bsv_1 = require("bsv");
const signed_message_1 = require("./signed-message");
class FyxOwner {
    constructor(apiUrl, bip32, fyxId, derivation = 'm') {
        this.apiUrl = apiUrl;
        this.bip32 = bip32;
        this.fyxId = fyxId;
        this.derivation = derivation;
        this.derivations = [];
    }
    async nextOwner() {
        const { data: address } = await axios_1.default.post(`${this.apiUrl}/accounts`, new signed_message_1.SignedMessage({
            subject: 'RequestPaymentAddress',
            payload: JSON.stringify({ fyxId: this.fyxId })
        }, bsv_1.KeyPair.fromPrivKey(this.bip32.derive(this.derivation).privKey)));
        return address;
    }
    async sign(rawtx, parents, locks) {
        const keyPairs = new Map();
        this.derivations.forEach((acc, d) => {
            let keyPair = bsv_1.KeyPair.fromPrivKey(this.bip32.derive(d).privKey);
            const script = bsv_1.Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
            keyPairs.set(script, keyPair);
        });
        const tx = bsv_1.Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = bsv_1.TxOut.fromProperties(bsv_1.Bn(parents[i].satoshis), bsv_1.Script.fromHex(parents[i].script));
            if (txOut.script.isPubKeyHashOut()) {
                const keyPair = keyPairs.get(txOut.script.toHex());
                if (!keyPair)
                    return;
                const sig = await tx.asyncSign(keyPair, undefined, i, txOut.script, txOut.valueBn);
                txIn.setScript(new bsv_1.Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
            }
        }));
        return tx.toHex();
    }
}
exports.FyxOwner = FyxOwner;
//# sourceMappingURL=fyx-owner.js.map