import { Address, Bn, KeyPair, Script, Tx, TxIn } from 'bsv';
import { RestBlockchain } from './rest-blockchain';

export class LockingPurse {
    address: string;
    private script: Script;
    constructor(
        private keyPair: KeyPair, 
        private blockchain: RestBlockchain, 
        private redis: any, 
        private changeAddress?: string, 
        public satsPerByte = 0.5, 
        private recycleThreashold = 50000
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }

    async pay (rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);
        let fee = Math.ceil(rawtx.length / 2 * this.satsPerByte);
        let totalIn = parents.reduce((a, {satoshis}) => a + satoshis, 0);
        const totalOut = tx.txOuts.reduce((a, {valueBn}) => a + valueBn.toNumber(), 0);
        if(totalIn >= totalOut + fee) return rawtx;
        
        fee += Math.ceil(((rawtx.length / 2) + 160) * this.satsPerByte);
        const utxos = await this.blockchain.utxos(this.script.toHex(), 25);
        let utxo;
        for (const u of utxos) {
            const lockKey = `lock:${u.txid}_o${u.vout}`;
            if (await this.redis.setnx(lockKey, Date.now())) {
                await this.redis.expire(lockKey, 60);
                console.log('UTXO Selected:', lockKey, utxo);
                utxo = u;
                break;
            } else {
                console.log('UTXO locked:', lockKey);
            }
        }
        if (!utxo) throw new Error(`No UTXOs found for purse: ${this.address}`);

        tx.addTxIn(
            Buffer.from(utxo.txid, 'hex').reverse(),
            utxo.vout,
            Script.fromString('OP_0 OP_0'),
            TxIn.SEQUENCE_FINAL
        );
        totalIn += utxo.satoshis;
        
        const change = totalIn - totalOut - fee;
        const changeScript = (!this.changeAddress || change > this.recycleThreashold) ?
            this.script :
            Address.fromString(this.changeAddress).toTxOutScript();
        tx.addTxOut(
            Bn(change),
            changeScript
        );
        
        const sig = await tx.asyncSign(this.keyPair, undefined, tx.txIns.length - 1, Script.fromString(utxo.script), Bn(utxo.satoshis));
        const sigScript = new Script()
            .writeBuffer(sig.toTxFormat())
            .writeBuffer(this.keyPair.pubKey.toBuffer());
        tx.txIns[tx.txIns.length - 1].setScript(sigScript);

        return tx.toHex();
    }
}