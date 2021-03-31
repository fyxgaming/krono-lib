import { Address, Bn, KeyPair, Script, Sig, Tx, TxOut } from 'bsv';
export class FyxOwner {
    constructor(apiUrl, bip32, fyxId) {
        this.apiUrl = apiUrl;
        this.bip32 = bip32;
        this.fyxId = fyxId;
        this.keyPairs = new Map();
        let keyPair = KeyPair.fromPrivKey(this.bip32.derive('m/1/0').privKey);
        const script = Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
        this.keyPairs.set(script, keyPair);
    }
    async nextOwner() {
        const address = Address.fromPubKey(this.bip32.derive('m/1/0').pubKey).toString();
        return address;
    }
    async sign(rawtx, parents, locks) {
        const tx = Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = TxOut.fromProperties(new Bn(parents[i].satoshis), Script.fromHex(parents[i].script));
            if (txOut.script.isPubKeyHashOut()) {
                const keyPair = this.keyPairs.get(txOut.script.toHex());
                if (!keyPair)
                    return;
                const sig = await tx.asyncSign(keyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
                txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
            }
        }));
        console.log('Signed TX:', tx.toString());
        return tx.toHex();
    }
    async addDerivations(derivations) {
        derivations.forEach((d) => {
            if (!d)
                return;
            let keyPair = KeyPair.fromPrivKey(this.bip32.derive(d).privKey);
            const script = Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
            this.keyPairs.set(script, keyPair);
        });
    }
}
//# sourceMappingURL=fyx-owner.js.map