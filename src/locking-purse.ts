import { Address, KeyPair, Script } from 'bsv';
import { RestBlockchain } from './rest-blockchain';

export class LockingPurse {
    address: string;
    private script: Script;
    constructor(
        public keyPair: KeyPair, 
        public blockchain: RestBlockchain, 
        public redis: any,
        public changeSplitSats = 250000
    ) {
        const address = Address.fromPrivKey(keyPair.privKey);
        this.script = address.toTxOutScript();
        this.address = address.toString();
    }

    async pay (rawtx: string, parents: { satoshis: number, script: string }[]) {
        return this.blockchain.applyPayments(rawtx, [], this.address, this.changeSplitSats);
    }

    async utxos(): Promise<any> {
        return this.blockchain.utxos(this.script.toHex());
    }

    async balance(): Promise<number> {
        return this.blockchain.balance(this.address);
    }
}