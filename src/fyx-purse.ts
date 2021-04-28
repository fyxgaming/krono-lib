import { Script, Tx } from 'bsv';
import Run from 'run-sdk'
import orderLockRegex from './order-lock-regex';
import { RestBlockchain } from './rest-blockchain';
export class FyxPurse extends Run.plugins.LocalPurse {
    public blockchain: RestBlockchain;
    async pay(rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);
        const orderUnlockVout = parents[0]?.script.match(orderLockRegex);
        if(orderUnlockVout && tx.txOuts[0].script.isSafeDataOut()) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromString('OP_0 OP_0'), 2**32-1);
            // const txid = Buffer.from(tx.txIns[0].txHashBuf).reverse().toString('hex');
            // const lockRawTx = await this.blockchain.fetch(txid);
            // const lockTx = Tx.fromString(lockRawTx);
            // rawtx = tx.toHex();
            // parents.push({
            //     script: lockTx.txOuts[0].script.toHex(),
            //     satoshis: lockTx.txOuts[0].valueBn.toNumber()
            // })
            return tx.toHex();
        };
        return super.pay(rawtx, parents);
    }
}