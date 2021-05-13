import { Address, Bn, KeyPair, Script, Sig, Tx, TxIn } from 'bsv';
import { RestBlockchain } from './rest-blockchain';
import { Buffer } from 'buffer';

const DUST_LIMIT = 273;
const SIG_SIZE = 114;
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;

export class LockingPurse {
    address: string;
    private script: Script;
    changeAddress?: string;
    private changeScript?: Script;
    constructor(
        public keyPair: KeyPair, 
        public blockchain: RestBlockchain, 
        public redis: any,
        public changeKeyPair?: KeyPair,
        public changeThreashold = 10000,
        public satsPerByte = 0.5
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
        if(changeKeyPair) {
            const changeAddress = Address.fromPrivKey(changeKeyPair.privKey);
            this.changeAddress = changeAddress.toString();
            this.changeScript = changeAddress.toTxOutScript();
        }
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
            const script =  this.changeScript && change < this.changeThreashold ?
                this.changeScript :
                this.script;

            tx.addTxOut(new Bn(change), script);
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

    async utxos(): Promise<any> {
        return this.blockchain.utxos(this.script.toHex());
    }

    async changeUtxos(): Promise<any> {
        if(!this.changeScript) return [];
        return this.blockchain.utxos(this.changeScript.toHex());
    }

    async balance(): Promise<number> {
        const balance = (await this.blockchain.balance(this.address)) +
            (this.changeAddress ? await this.blockchain.balance(this.changeAddress) : 0)
        return balance;
    }

    async rebalance(txOutValueTarget: number = 100000): Promise<boolean> {
        const SATS_PER_BYTE = this.satsPerByte;
        const tx = new Tx();
        let utxos = await this.changeUtxos();
        if (utxos.length < 1) {
            console.log(`Unable to rebalance if there are no utxos.`);
            return false;
        }

        const totalIn = utxos.reduce((acc, utxo) => acc += utxo.satoshis, 0);

        let txOutCountEstimate = Math.floor(totalIn / txOutValueTarget);
        if (txOutCountEstimate < 2) {
            console.log(`Unable to rebalance a low amount of value. Current value: ${totalIn}`);
            return false; 
        }
        let totalInSizeEst = utxos.length * (SIG_SIZE + INPUT_SIZE) * SATS_PER_BYTE;
        let totalSizeEst = totalInSizeEst + txOutCountEstimate * txOutValueTarget + txOutCountEstimate * OUTPUT_SIZE * SATS_PER_BYTE;
        while(totalSizeEst > totalIn) { // Reduce number of outputs to make sure there is enough change
            txOutCountEstimate--;
            totalSizeEst = totalInSizeEst + txOutCountEstimate * txOutValueTarget + txOutCountEstimate * OUTPUT_SIZE * SATS_PER_BYTE;
        }
        // ADD txIns from changeAddress UTXOs
        const inputsToSign = utxos.reduce((acc, utxo) => {
            acc.set(tx.txIns.length, utxo);
            tx.addTxIn(
                Buffer.from(utxo.txid, 'hex').reverse(),
                utxo.vout,
                Script.fromString('OP_0 OP_0'),
                TxIn.SEQUENCE_FINAL
            );
            return acc;
        }, new Map<number, any>());
        // ADD txOuts BASED ON CALCULATED TARGETS
        while (tx.txOuts.length < txOutCountEstimate) {
            tx.addTxOut(new Bn(txOutValueTarget), this.script);
        }
        // ADD CHANGE
        const change = totalIn - totalSizeEst;
        if(change > DUST_LIMIT) {
            const script = this.changeScript && change < this.changeThreashold ?
                this.changeScript :
                this.script;

            tx.addTxOut(new Bn(change), script);
        }
        // SIGN INPUTS
        await Promise.all([...inputsToSign.entries()].map(async ([vin, utxo]) => {
            const sig = await tx.asyncSign(this.changeKeyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, vin, Script.fromString(utxo.script), new Bn(utxo.satoshis));
            const sigScript = new Script()
                .writeBuffer(sig.toTxFormat())
                .writeBuffer(this.changeKeyPair.pubKey.toBuffer());
            tx.txIns[vin].setScript(sigScript);
        }));

        await this.blockchain.broadcast(tx.toHex());

        return true;
    }
}