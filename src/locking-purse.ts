import { Address, Bn, KeyPair, Script, Sig, Tx, TxOut } from 'bsv';
import { IBlockchain } from './iblockchain';

export class LockingPurse {
    address: string;
    private script: string;
    constructor(
        public keyPair: KeyPair, 
        public blockchain: IBlockchain, 
        public changeSplitSats = 250000,
        public satsPerByte = 0.25
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript().toHex();
        this.address = address.toString();
    }

    async pay (rawtx: string, parents: { satoshis: number, script: string }[]): Promise<string> {
        rawtx = await this.blockchain.applyPayments(rawtx, [], this.address, this.changeSplitSats, this.satsPerByte);
        parents = await this.blockchain.loadParents(rawtx);
        const tx = Tx.fromHex(rawtx);
        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const {script, satoshis} = parents[i];
            if(script !== this.script) return;
            const lockScript = Script.fromHex(script);
            const txOut = TxOut.fromProperties(new Bn(satoshis), lockScript);
            const sig = await tx.asyncSign(this.keyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
            txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(this.keyPair.pubKey.toBuffer()));
        }));
        return tx.toHex();
    }

    async utxos(): Promise<any> {
        const utxos = await this.blockchain.utxos(this.script);

        return utxos.map(u => ({
            ...u,
            script: this.script
        }));
    }

    async balance(): Promise<number> {
        return this.blockchain.balance(this.address);
    }

    async utxoCount(): Promise<number> {
        return this.blockchain.utxoCount(this.script);
    }
}