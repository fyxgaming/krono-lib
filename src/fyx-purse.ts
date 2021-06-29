import { KeyPair, Script, Tx } from 'bsv';
import { LockingPurse } from './locking-purse';
import orderLockRegex from './order-lock-regex';
import { RestBlockchain } from './rest-blockchain';

// export class FyxPurse extends Run.plugins.LocalPurse {

export class UtxoLock {
    protected locks = new Map<string, any>();
    async setnx(key: string, value: any): Promise<0|1> {
        if(this.locks.has(key)) return 0;
        this.locks.set(key, value);
        return 1;
    }
    async expire(key: string, seconds) {
        setTimeout(() => this.locks.delete(key), seconds * 1000)
    }

}
export class FyxPurse extends LockingPurse {
    constructor(
        keyPair: KeyPair, 
        blockchain: RestBlockchain, 
        splits = 10,
        satsPerByte = 0.5
    ) {
        super(
            keyPair, 
            blockchain, 
            new UtxoLock(),
            splits,
            satsPerByte
        );
    }
    
    async pay(rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);
        const orderUnlockVout = parents[0]?.script.match(orderLockRegex);
        if(orderUnlockVout) {
            tx.txIns[0].setScript(Script.fromBuffer(Buffer.from(new Array(1568).fill(0))));
            if(tx.txOuts[0].script.isSafeDataOut()) {
                tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromBuffer(Buffer.from(new Array(25).fill(0))), 2**32-1);
                const sourceRawTx = await this.blockchain.fetch(Buffer.from(tx.txIns[0].txHashBuf).reverse().toString('hex'));
                const sourceTx = Tx.fromHex(sourceRawTx);
                parents.push({
                    script: sourceTx.txOuts[0].script.toHex(),
                    satoshis: sourceTx.txOuts[0].valueBn.toNumber()
                })
                return super.pay(tx.toHex(), parents);
            }
        }
        return super.pay(tx.toHex(), parents);
    }
}