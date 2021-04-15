import axios from 'axios';
import { Address, Bn, KeyPair, Script, Sig, Tx, TxOut } from 'bsv';
import { SignedMessage } from './signed-message';
export class FyxOwner {
    public keyPairs = new Map<string, KeyPair>();

    constructor(public apiUrl: string, private bip32, public fyxId: string, public userId: string, private keyPair: KeyPair) { }

    async nextOwner() {
        const { data: { address } } = await axios.post(
            `${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/payment-destination`,
            new SignedMessage({}, this.userId, this.keyPair)
        )
        return address;
    }

    async sign(rawtx: string, parents: { satoshis: number, script: string }[], locks: any[]): Promise<string> {
        const tx = Tx.fromHex(rawtx);

        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const txOut = TxOut.fromProperties(new Bn(parents[i].satoshis), Script.fromHex(parents[i].script));
            
            const keyPair = this.keyPairs.get(txOut.script.toHex());
            if (!keyPair) return;
            const sig = await tx.asyncSign(keyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
            txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
        }));

        console.log('Signed TX:', tx.toString());
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
    
    async loadDerivations() {
        const { data: derivations } = await axios.post(
            `${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/derivations`,
            new SignedMessage({}, this.userId, this.keyPair)
        )
        derivations.forEach(d => {
            if (this.keyPairs.has(d.script)) return;
            this.keyPairs.set(d.script, KeyPair.fromPrivKey(this.bip32.derive(d.path).privKey));
        })
    }
}