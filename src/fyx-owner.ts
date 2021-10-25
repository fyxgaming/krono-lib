import axios from 'axios';
import { Address, Bn, Bw, KeyPair, Script, Sig, Tx, TxOut } from 'bsv';
import { SignedMessage } from './signed-message';
import orderLockRegex from './order-lock-regex';

const FEE_RATE = 0.025;
const DUST_LIMIT = 273;
export class FyxOwner {
    public keyPairs = new Map<string, KeyPair>();
    private _batonAddress: Address;
    private _paymentAddress: Address;
    public pubkey: string;
    public feeRate = FEE_RATE;

    constructor(public apiUrl: string, private bip32, public fyxId: string, public userId: string, private keyPair: KeyPair, protected feeAddress?: string) {
        this._paymentAddress = Address.fromPrivKey(bip32.derive('m/0/0').privKey);
        const batonPrivKey = bip32.derive('m/1/0').privKey
        this._batonAddress = Address.fromPrivKey(batonPrivKey);
        this.keyPairs.set(this._batonAddress.toTxOutScript().toHex(), KeyPair.fromPrivKey(batonPrivKey));
        this.pubkey = keyPair.pubKey.toString();
    }

    get batonAddress() {
        return this._batonAddress.toString();
    }

    get paymentAddress() {
        return this._paymentAddress.toString();
    }

    async nextOwner() {
        const { data: { address } } = await axios.post(
            `${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/payment-destination`,
            new SignedMessage({subject: 'GetPaymentDestination'}, this.userId, this.keyPair)
        )
        return address;
    }

    async loadDerivations() {
        const { data: derivations } = await axios.post(
            `${this.apiUrl}/accounts/${this.fyxId}/${this.userId}/derivations`,
            new SignedMessage({subject: 'LoadDerivations'}, this.userId, this.keyPair)
        )
        console.log('Derivations:', derivations);
        derivations.forEach(d => {
            if (this.keyPairs.has(d.script)) return;
            this.keyPairs.set(d.script, KeyPair.fromPrivKey(this.bip32.derive(d.path).privKey));
        })
    }

    async sign(rawtx: string, parents: { satoshis: number, script: string }[], locks?: any[]): Promise<string> {
        const tx = Tx.fromHex(rawtx);
        await this.loadDerivations();

        await Promise.all(tx.txIns.map(async (txIn, i) => {
            const lockScript = Script.fromHex(parents[i].script);
            if(!i && parents[0].script.match(orderLockRegex)) {
                const script = this.signOrderLock(tx, lockScript, new Bn(parents[i].satoshis))
                txIn.setScript(script);
                return;
            }
            const txOut = TxOut.fromProperties(new Bn(parents[i].satoshis), lockScript);
            const keyPair = this.keyPairs.get(txOut.script.toHex());
            if (!keyPair) {
                console.log('Missing Keypair:', txOut.script.toHex())
                return;
            }
            const sig = await tx.asyncSign(keyPair, Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, i, txOut.script, txOut.valueBn);
            txIn.setScript(new Script().writeBuffer(sig.toTxFormat()).writeBuffer(keyPair.pubKey.toBuffer()));
        }));

        console.log('Signed TX:', tx.toString());
        return tx.toHex();
    }

    getListingBase(): string {
        const tx = new Tx();
        tx.addTxOut(new Bn(546), this._batonAddress.toTxOutScript());
        return tx.toHex();
    }

    getPurchaseBase({address, satoshis}): string {
        const tx = new Tx();
        tx.addTxOut(new Bn(satoshis), Address.fromString(address).toTxOutScript());
        if(this.feeAddress) {
            const tradingFee = Math.max(Math.floor(satoshis * this.feeRate), DUST_LIMIT)
            tx.addTxOut(new Bn(tradingFee), Address.fromString(this.feeAddress).toTxOutScript());
        }
        return tx.toHex();
    }

    signOrderLock(tx, script, valueBn) {
        const isCancel = tx.txOuts[0].script.isSafeDataOut();
        const preimage = tx.sighashPreimage(
            Sig.SIGHASH_FORKID | (isCancel ? Sig.SIGHASH_NONE : (Sig.SIGHASH_SINGLE | Sig.SIGHASH_ANYONECANPAY)),
            0,
            script,
            valueBn,
            Tx.SCRIPT_ENABLE_SIGHASH_FORKID
        );

        let asm: string;
        if (isCancel) {
            const bw = new Bw();
            tx.txIns.forEach((txIn, i) => {
                if (i < 2) return;
                bw.write(txIn.txHashBuf); // outpoint (1/2)
                bw.writeUInt32LE(txIn.txOutNum); // outpoint (2/2)  
            });
            const prevouts = bw.toBuffer();
            asm = `${preimage.toString('hex')} ${prevouts.toString('hex')} OP_TRUE`;
        } else {
            asm = `${preimage.toString('hex')} 00 OP_FALSE`;
        }

        return Script.fromAsmString(asm);
        // tx.txIns[0].setScript(Script.fromAsmString(asm));

        // return tx.toHex();
    }
}