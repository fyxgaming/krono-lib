import { Script, Tx } from 'bsv';
import Run from 'run-sdk'
import orderLockRegex from './order-lock-regex';
export class FyxPurse extends Run.plugins.LocalPurse {
    async pay(rawtx: string, parents: { satoshis: number, script: string }[]) {
        const tx = Tx.fromHex(rawtx);

        const orderUnlockVout = parents[0]?.script.match(orderLockRegex);
        if(orderUnlockVout) {
            tx.addTxIn(tx.txIns[0].txHashBuf, 0, Script.fromString('OP_0 OP_0'), 2**32-1);
            return tx.toHex();
        };
        return super.pay(rawtx, parents);
    }
}