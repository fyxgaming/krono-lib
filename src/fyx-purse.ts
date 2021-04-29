import { Script, Tx } from 'bsv';
import Run from 'run-sdk'
import orderLockRegex from './order-lock-regex';
import { RestBlockchain } from './rest-blockchain';
export class FyxPurse extends Run.plugins.LocalPurse {
    public blockchain: RestBlockchain;
    async pay(rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);
        tx.txIns[0].setScript(Script.fromBuffer(Buffer.from(new Array(1568).fill(0))));
        const orderUnlockVout = parents[0]?.script.match(orderLockRegex);
        if(orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromBuffer(Buffer.from(new Array(25).fill(0))), 2**32-1);
            if(tx.txOuts[0].script.isSafeDataOut()) return tx.toHex();

            const txid = Buffer.from(tx.txIns[0].txHashBuf).reverse().toString('hex');
            const lockRawTx = await this.blockchain.fetch(txid);
            const lockTx = Tx.fromString(lockRawTx);
            rawtx = tx.toHex();
            parents.push({
                script: lockTx.txOuts[0].script.toHex(),
                satoshis: lockTx.txOuts[0].valueBn.toNumber()
            })
        };
        return super.pay(rawtx, parents);
    }
}