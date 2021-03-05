"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyxOwner = void 0;
const bsv_1 = require("bsv");
// import { HttpError } from './http-error';
// import { SignedMessage } from './signed-message';
class FyxOwner {
    constructor(apiUrl, bip32, fyxId) {
        this.apiUrl = apiUrl;
        this.bip32 = bip32;
        this.fyxId = fyxId;
        this.keyPairs = new Map();
    }
    async nextOwner() {
        // const resp = await globalThis.fetch(`${this.apiUrl}/accounts`, {
        //     method: 'POST',
        //     headers: {'Content-type': 'application/json'},
        //     body: JSON.stringify(new SignedMessage({
        //         subject: 'RequestPaymentAddress',
        //         payload: JSON.stringify({ fyxId: this.fyxId })
        //     }, this.userId, KeyPair.fromPrivKey(this.keyPair.privKey)))
        // });
        // if(!resp.ok) throw new HttpError(resp.status, resp.statusText);
        // const {address} = await resp.json();
        // return address;
        const address = bsv_1.Address.fromPubKey(this.bip32.derive('m/1/0').pubKey).toString();
        return address;
    }
    async sign(rawtx, parents, locks) {
        const tx = bsv_1.Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = bsv_1.TxOut.fromProperties(bsv_1.Bn(parents[i].satoshis), bsv_1.Script.fromHex(parents[i].script));
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
}
exports.FyxOwner = FyxOwner;
//# sourceMappingURL=fyx-owner.js.map