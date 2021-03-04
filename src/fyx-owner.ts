import { Address, Bn, KeyPair, Script, Tx, TxOut } from 'bsv';
// import { HttpError } from './http-error';
// import { SignedMessage } from './signed-message';


export class FyxOwner {
    private keyPairs = new Map<string, KeyPair>();

    constructor(public apiUrl: string, private bip32, public fyxId: string) { }

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
        const address = Address.fromPubKey(this.bip32.derive('m/1/0').pubKey).toString();
        return address;   
    }

    async sign(rawtx: string, parents: { satoshis: number, script: string }[], locks: any[]): Promise<string> {
        const tx = Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = TxOut.fromProperties(Bn(parents[i].satoshis), Script.fromHex(parents[i].script));
            if (txOut.script.isPubKeyHashOut()) {
                const keyPair = this.keyPairs.get(txOut.script.toHex());
                if(!keyPair) return;
                const sig = await tx.asyncSign(keyPair, undefined, i, txOut.script, txOut.valueBn);
                txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
            }
        }));

        return tx.toHex();
    }

    async addDerivations(derivations: string[]) {
        derivations.forEach((d) => {
            if(!d) return;
            let keyPair = KeyPair.fromPrivKey(this.bip32.derive(d).privKey);
            const script = Address.fromPubKey(keyPair.pubKey).toTxOutScript().toHex();
            this.keyPairs.set(script, keyPair)
        });
    }

}