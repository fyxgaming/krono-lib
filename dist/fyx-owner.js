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
    constructor(apiUrl, bip32, fyxId, userId, keyPair) {
        this.apiUrl = apiUrl;
        this.bip32 = bip32;
        this.fyxId = fyxId;
        this.userId = userId;
        this.keyPair = keyPair;
        this.keyPairs = new Map();
    }
    async nextOwner() {
        const { data: { address } } = await axios_1.default.post(`${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/payment-destination`, new signed_message_1.SignedMessage({}, this.userId, this.keyPair));
        return address;
    }
    async sign(rawtx, parents, locks) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = bsv_1.TxOut.fromProperties(new bsv_1.Bn(parents[i].satoshis), bsv_1.Script.fromHex(parents[i].script));
            if (txOut.script.isPubKeyHashOut()) {
                const keyPair = this.keyPairs.get(txOut.script.toHex());
                if (!keyPair)
                    return;
                const sig = await tx.asyncSign(keyPair, bsv_1.Sig.SIGHASH_ALL | bsv_1.Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
                txIn.setScript(new bsv_1.Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
            }
        }));
        console.log('Signed TX:', tx.toString());
        return tx.toHex();
    }
    async addDerivations(derivations) {
        derivations.forEach((d) => {
            if (!d)
                return;
            let keyPair = bsv_1.KeyPair.fromPrivKey(this.bip32.derive(d).privKey);
            const script = bsv_1.Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
            this.keyPairs.set(script, keyPair);
        });
    }
    async loadDerivations() {
        const { data: paths } = await axios_1.default.post(`${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/derivations`, new signed_message_1.SignedMessage({}, this.userId, this.keyPair));
        for (const [script, path] of Object.entries(paths)) {
            if (this.keyPairs.has(script))
                continue;
            this.keyPairs.set(script, bsv_1.KeyPair.fromPrivKey(this.bip32.derive(path).privKey));
        }
    }
}
exports.FyxOwner = FyxOwner;
//# sourceMappingURL=fyx-owner.js.map