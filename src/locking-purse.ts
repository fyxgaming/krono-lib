import { Address, Bn, KeyPair, Script, Sig, Tx, TxIn } from 'bsv';
import { RestBlockchain } from './rest-blockchain';

const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;

export class LockingPurse {
    address: string;
    private script: Script;
    constructor(
        private keyPair: KeyPair, 
        private blockchain: RestBlockchain, 
        private redis: any, 
        public satsPerByte = 0.5
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }

    async pay (rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);
        let size = tx.toBuffer().length;
        let totalIn = 0;
        parents.forEach(({satoshis}, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer()
            size += (scriptBuf.length > 100 ? 0 : SIG_SIZE);
            totalIn += satoshis;
        }, 0);
        let totalOut = tx.txOuts.reduce((a, {valueBn}) => a + valueBn.toNumber(), 0);
        
        const inputsToSign = new Map<number, any>();
        if(totalIn < totalOut + (size * this.satsPerByte)) {
            const utxos = await this.blockchain.utxos(this.script.toHex(), 50);
            while(totalIn < totalOut + (size * this.satsPerByte)) {
                size += INPUT_SIZE;
                const utxo = utxos.pop();
                if(!utxo) break;
                const lockKey = `lock:${utxo.txid}_o${utxo.vout}`;
                if (await this.redis.setnx(lockKey, Date.now())) {
                    await this.redis.expire(lockKey, 60);
                    console.log('UTXO Selected:', lockKey, utxo);
                    inputsToSign.set(tx.txIns.length, utxo);
                    tx.addTxIn(
                        Buffer.from(utxo.txid, 'hex').reverse(),
                        utxo.vout,
                        Script.fromString('OP_0 OP_0'),
                        TxIn.SEQUENCE_FINAL
                    );
                    totalIn += utxo.satoshis;
                    size += INPUT_SIZE;
                } else {
                    console.log('UTXO locked:', lockKey);
                }
            }
            if (totalIn < totalOut + (size * this.satsPerByte)) 
                throw new Error(`Inadequate UTXOs for purse: ${this.address}`);
        }
        
        const change = totalIn - totalOut - ((size + OUTPUT_SIZE) * this.satsPerByte);
        if(change > DUST_LIMIT) {
            tx.addTxOut(new Bn(change), this.script);
        }
        
        await Promise.all([...inputsToSign.entries()].map(async ([vin, utxo]) => {
            const sig = await tx.asyncSign(this.keyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, vin, Script.fromString(utxo.script), new Bn(utxo.satoshis));
            const sigScript = new Script()
                .writeBuffer(sig.toTxFormat())
                .writeBuffer(this.keyPair.pubKey.toBuffer());
            tx.txIns[vin].setScript(sigScript);
        }));

        return tx.toHex();
    }
}