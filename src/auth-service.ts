import * as argon2 from 'argon2-browser';
import { Bip32, Bip39, Bn, Constants, Ecdsa, Ecies, Hash, KeyPair, Point, PrivKey } from 'bsv';
import axios from './fyx-axios';
import { SignedMessage } from './signed-message';
import { Buffer } from 'buffer';

export class AuthService {
    private network: string;

    constructor(private apiUrl: string, network: string) { 
        this.network = network.slice(0, 4);
    }

    async generateKeyPair(id: string, password: string): Promise<KeyPair> {
        id = id.toLowerCase().normalize('NFKC');
        const salt = Hash.sha256(Buffer.concat([Buffer.from(this.network), Buffer.from(id)]));
        const pass = Hash.sha256(Buffer.from(password.normalize('NFKC')));
        const { hash } = await argon2.hash({ pass, salt, time: 100, mem: 1024, hashLen: 32 });
        if(!(new Bn().fromBuffer(Buffer.from(hash)).lt(Point.getN()))){
            throw new Error('BigInteger is out of range of valid private keys')
        }
        const versionByteNum = this.network === 'main' ?
            Constants.Mainnet.PrivKey.versionByteNum :
            Constants.Testnet.PrivKey.versionByteNum;
        const keybuf = Buffer.concat([
            Buffer.from([versionByteNum]),
            Buffer.from(hash),
            Buffer.from([1]) // compressed flag
        ]);
        const privKey = PrivKey.fromBuffer(keybuf);
        return KeyPair.fromPrivKey(privKey);
    }

    async register(id: string, password: string, email: string, firstName = '', lastName = ''): Promise<KeyPair> {
        id = id.toLowerCase().normalize('NFKC');
        const keyPair = await this.generateKeyPair(id, password);
        const bip39 = Bip39.fromRandom();
        const bip32 = Bip32.fromSeed(bip39.toSeed());

        const recoveryBuf = Ecies.bitcoreEncrypt(
            bip39.toBuffer(),
            keyPair.pubKey,
            keyPair
        );
        const reg: any = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            firstName,
            lastName,
            email
        };

        let msgBuf = Buffer.from(`${id}|${reg.xpub}|${reg.recovery}|${email}`);
        if(firstName) msgBuf = Buffer.concat([msgBuf, Buffer.from(`|${firstName}`)]);
        if(lastName) msgBuf = Buffer.concat([msgBuf, Buffer.from(`|${lastName}`)]);
        const msgHash = await Hash.asyncSha256(msgBuf);
        const sig = Ecdsa.sign(msgHash, keyPair);
        reg.sig = sig.toString();

        await axios.post(`${this.apiUrl}/accounts/${id}`, reg);
        return keyPair;
    }

    async recoverBip39(id: string, keyPair: KeyPair): Promise<Bip32> {
        id = id.toLowerCase().normalize('NFKC');
        const { data: { path, recovery }} = await axios.post(
            `${this.apiUrl}/accounts/${id}/recover`, 
            new SignedMessage({subject: 'recover'}, id, keyPair)
        );

        const recoveryBuf = Ecies.bitcoreDecrypt(
            Buffer.from(recovery, 'base64'),
            keyPair.privKey
        );
        return Bip39.fromBuffer(recoveryBuf);
    }
    
    async recover(id: string, keyPair: KeyPair): Promise<Bip32> {
        const bip39 = await this.recoverBip39(id, keyPair);
        return Bip32.fromSeed(bip39.toSeed());
    }

    async mnemonic(id: string, keyPair: KeyPair): Promise<string> {
        const bip39 = await this.recoverBip39(id, keyPair);
        return bip39.toString();
    }

    async getProfile(id: string, keyPair: KeyPair): Promise<Bip32> {
        id = id.toLowerCase().normalize('NFKC');
        const { data: user} = await axios.post(
            `${this.apiUrl}/accounts/${id}/recover`, 
            new SignedMessage({subject: 'recover'}, id, keyPair)
        );

        return user;
    }

    async rekey(mnemonic: string, id: string, password: string): Promise<KeyPair> {
        const bip39 = Bip39.fromString(mnemonic);
        const bip32 = Bip32.fromSeed(bip39.toSeed());        
        const keyPair = await this.generateKeyPair(id, password);
        const recoveryBuf = Ecies.bitcoreEncrypt(
            bip39.toBuffer(),
            keyPair.pubKey,
            keyPair
        );
        await axios.put(
            `${this.apiUrl}/accounts/${id}`, 
            new SignedMessage({
                subject: 'rekey',
                payload: JSON.stringify({
                    pubkey: keyPair.pubKey.toString(),
                    recovery: recoveryBuf.toString('base64'),
                    xpub: bip32.toPublic().toString()
                })
            }, id, KeyPair.fromPrivKey(bip32.privKey))
        );

        return keyPair;
    }

    public async isIdAvailable(id: string): Promise<boolean> {
        id = id.toLowerCase().normalize('NFKC');
        try {
            const user = await axios(`${this.apiUrl}/accounts/${id}`);
            return false;
        } catch (e) {
            if(e.status === 404) return true;
            throw e;
        }
    }

    public async verifyEmail(id: string, nonce: string): Promise<boolean> {
        try {
            await axios.post(`${this.apiUrl}/accounts/emails/verify/${id}/${nonce}`);
            return true;
        } catch(e) {
            if(e.status === 401) return false;
            throw e;
        }
    }

    public async requestVerificationEmail(id) {
        await axios.post(`${this.apiUrl}/accounts/emails/generate/${id}`);
    }
}