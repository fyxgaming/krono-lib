import * as argon2 from 'argon2-browser';
import { Bip32, Constants, Ecies, Hash, KeyPair, PrivKey } from 'bsv';
import { SignedMessage } from './signed-message';
import { Buffer } from 'buffer';
import createError from 'http-errors';
import fetch from 'node-fetch';

export class AuthService {
    constructor(private apiUrl: string, private network: string) { }

    async generateKeyPair(id: string, password: string): KeyPair {
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

    async register(id: string, password: string, email: string): Promise<string> {
        const keyPair = await this.generateKeyPair(id, password);
        const bip32 = Bip32.fromRandom();

        const recoveryBuf = Ecies.bitcoreEncrypt(
            Buffer.from(bip32.toString()),
            keyPair.pubKey,
            keyPair
        );
        const reg: any = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            email
        };

        const resp = await fetch(`${this.apiUrl}/accounts`, {
            method: 'POST', 
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(new SignedMessage({
                subject: 'Register',
                payload: JSON.stringify({
                    id,
                    xpub: bip32.toPublic().toString(),
                    recovery: recoveryBuf.toString('base64'),
                    email
                })
            }, keyPair))
        });
        if(!resp.ok) throw createError(resp.status, resp.statusText)

        return keyPair;
    }

    async recover(id: string, keyPair: KeyPair) {
        const resp = await fetch(`${this.apiUrl}/accounts`, {
            method: 'POST', 
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(new SignedMessage({
                subject: 'Recover'
            }, keyPair))
        });
        if(!resp.ok) throw createError(resp.status, resp.statusText);
        const {path, recovery} = await resp.json();
        
        const recoveryBuf = Ecies.bitcoreDecrypt(
            Buffer.from(recovery, 'base64'),
            keyPair.privKey
        );
        return {
            xpriv: recoveryBuf.toString(),
            path
        };
    }

    public async isIdAvailable(id: string) {
        try {
            const resp = await fetch(`${this.apiUrl}/accounts/${id}`);
            if(!resp.ok && resp.status  !== 404) throw createError(resp.status, resp.statusText);
            return resp.status === 404;
        } catch (e) {
            throw e;
        }
    }
}