import { KeyPair, Script, Tx } from 'bsv';
import { IBlockchain } from './iblockchain';
import { LockingPurse } from './locking-purse';
import orderLockRegex from './order-lock-regex';
export class FyxPurse extends LockingPurse {
    constructor(
        keyPair: KeyPair, 
        blockchain: IBlockchain, 
        changeSplitSats = 0,
        satsPerByte = 0.25
    ) {
        super(
            keyPair, 
            blockchain, 
            changeSplitSats,
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