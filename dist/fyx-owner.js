"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxOwner = void 0;
const bsv_1 = require("bsv");
const http_error_1 = require("./http-error");
const signed_message_1 = require("./signed-message");
class FyxOwner {
    constructor(apiUrl, userId, keyPair, bip32, fyxId) {
        this.apiUrl = apiUrl;
        this.userId = userId;
        this.keyPair = keyPair;
        this.bip32 = bip32;
        this.fyxId = fyxId;
        this.derivations = [];
    }
    async nextOwner() {
        const resp = await globalThis.fetch(`${this.apiUrl}/accounts`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(new signed_message_1.SignedMessage({
                subject: 'RequestPaymentAddress',
                payload: JSON.stringify({ fyxId: this.fyxId })
            }, this.userId, bsv_1.KeyPair.fromPrivKey(this.keyPair.privKey)))
        });
        if (!resp.ok)
            throw new http_error_1.HttpError(resp.status, resp.statusText);
        const { address } = await resp.json();
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