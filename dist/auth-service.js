import * as argon2 from 'argon2-browser';
import { Bip32, Bip39, Constants, Ecdsa, Ecies, Hash, KeyPair, PrivKey } from '@ts-bitcoin/core';
import axios from './fyx-axios';
import { SignedMessage } from './signed-message';
import { Buffer } from 'buffer';
export class AuthService {
    constructor(apiUrl, network) {
        this.apiUrl = apiUrl;
        this.network = network;
    }
    async generateKeyPair(id, password) {
        id = id.toLowerCase().normalize('NFKC');
        const salt = Hash.sha256(Buffer.from(id));
        const pass = Hash.sha256(Buffer.from(password.normalize('NFKC')));
        const { hash } = await argon2.hash({ pass, salt, time: 100, mem: 1024, hashLen: 32 });
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
    async register(id, password, email) {
        id = id.toLowerCase().normalize('NFKC');
        const keyPair = await this.generateKeyPair(id, password);
        const bip39 = Bip39.fromRandom();
        const bip32 = Bip32.fromSeed(bip39.toSeed());
        const recoveryBuf = Ecies.bitcoreEncrypt(bip39.toBuffer(), keyPair.pubKey, keyPair);
        const reg = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            email
        };
        const msgBuf = Buffer.from(`${id}|${reg.xpub}|${reg.recovery}|${email}`);
        const msgHash = await Hash.asyncSha256(msgBuf);
        const sig = Ecdsa.sign(msgHash, keyPair);
        reg.sig = sig.toString();
        await axios.post(`${this.apiUrl}/accounts/${id}`, reg);
        return keyPair;
    }
    async recover(id, keyPair) {
        id = id.toLowerCase().normalize('NFKC');
        const { data: { path, recovery } } = await axios.post(`${this.apiUrl}/accounts`, new SignedMessage({ subject: 'Recover' }, id, keyPair));
        const recoveryBuf = Ecies.bitcoreDecrypt(Buffer.from(recovery, 'base64'), keyPair.privKey);
        const bip39 = Bip39.fromBuffer(recoveryBuf);
        return Bip32.fromSeed(bip39.toSeed());
    }
    async isIdAvailable(id) {
        id = id.toLowerCase().normalize('NFKC');
        try {
            await axios(`${this.apiUrl}/accounts/${id}`)
                .then(() => false)
                .catch(e => {
                if (e.status === 404)
                    return true;
                throw e;
            });
        }
        catch (e) {
            throw e;
        }
    }
}
//# sourceMappingURL=auth-service.js.map