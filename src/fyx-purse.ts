import { Address, Bn, KeyPair, Script, Sig, Tx, TxIn } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
import orderLockRegex from './order-lock-regex';

const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;

export class FyxPurse {
    address: string;
    private script: Script;
    constructor(
        private keyPair: KeyPair,
        private blockchain: RestBlockchain,
        public satsPerByte = 0.5,
        public debug = true,
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }

    async pay(rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);

        const orderUnlockVout = parents[0].script.match(orderLockRegex);
        if(orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromString('OP_0 OP_0'), 2**32-1);
            return tx.toHex();
        };
        let size = tx.toBuffer().length;
        let totalIn = 0;
        parents.forEach(({ satoshis }, i) => {
            const scriptBuf = tx.txIns[i].script.toBuffer()
            size += (scriptBuf.length > 100 ? 0 : SIG_SIZE);
            totalIn += satoshis;
        }, 0);
        let totalOut = tx.txOuts.reduce((a, { valueBn }) => a + valueBn.toNumber(), 0);

        const inputsToSign = new Map<number, any>();
        if (totalIn < totalOut + (size * this.satsPerByte)) {
            const utxos = await this.blockchain.utxos(this.script.toHex(), 50);
            while (totalIn < totalOut + (size * this.satsPerByte)) {
                size += INPUT_SIZE;
                const utxo = utxos.pop();
                if (!utxo) break;
                if(this.debug) console.log('UTXO Selected:', utxo);
                inputsToSign.set(tx.txIns.length, utxo);
                tx.addTxIn(
                    Buffer.from(utxo.txid, 'hex').reverse(),
                    utxo.vout,
                    Script.fromString('OP_0 OP_0'),
                    TxIn.SEQUENCE_FINAL
                );
                totalIn += utxo.satoshis;
                size += INPUT_SIZE;
            }
            if (totalIn < totalOut + (size * this.satsPerByte))
                throw new Error(`Inadequate UTXOs for purse: ${this.address}`);
        }

        const change = totalIn - totalOut - ((size + OUTPUT_SIZE) * this.satsPerByte);
        if (change > DUST_LIMIT) {
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

    async balance() {
        const utxos = await this.blockchain.utxos(this.script.toHex());
        return utxos.reduce((a, u) => a + u.satoshis, 0);
    }
}