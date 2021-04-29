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
        if(orderUnlockVout && tx.txOuts[0].script.isSafeDataOut()) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromBuffer(Buffer.from(new Array(25).fill(0))), 2**32-1);
            return tx.toHex();

        }
        return super.pay(rawtx, parents);
    }
}