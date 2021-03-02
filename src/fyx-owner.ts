import { Address, Bn, KeyPair, Script, Tx, TxOut } from 'bsv';
import createError from 'http-errors';
import { SignedMessage } from './signed-message';

export class FyxOwner {
    public derivations: string[] = [];

    constructor(public apiUrl: string, private bip32, public fyxId: string) { }

    async nextOwner() {
        const resp = await globalThis.fetch(`${this.apiUrl}/accounts`, {
            method: 'POST',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(new SignedMessage({
                subject: 'RequestPaymentAddress',
                payload: JSON.stringify({ fyxId: this.fyxId })
            }, KeyPair.fromPrivKey(this.bip32.privKey)))
        });
        if(!resp.ok) throw createError(resp.status, resp.statusText);
        const {address} = await resp.json();
        return address;
    }

    async sign(rawtx: string, parents: { satoshis: number, script: string }[], locks: any[]): Promise<string> {
        const keyPairs = new Map<string, KeyPair>();
        this.derivations.forEach((acc, d) => {
            let keyPair = KeyPair.fromPrivKey(this.bip32.derive(d).privKey);
            const script = Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
            keyPairs.set(script, keyPair)
        });

        const tx = Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = TxOut.fromProperties(Bn(parents[i].satoshis), Script.fromHex(parents[i].script));
            if (txOut.script.isPubKeyHashOut()) {
                const keyPair = keyPairs.get(txOut.script.toHex());
                if(!keyPair) return;
                const sig = await tx.asyncSign(keyPair, undefined, i, txOut.script, txOut.valueBn);
                txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
            }
        }));

        return tx.toHex();
    }

}