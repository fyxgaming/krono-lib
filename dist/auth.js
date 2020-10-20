"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KronoAuth = void 0;
const argon2 = __importStar(require("argon2-browser"));
const bsv_1 = require("bsv");
const signed_message_1 = require("./signed-message");
const node_fetch_1 = __importDefault(require("node-fetch"));
class KronoAuth {
    constructor(apiUrl, domain, network) {
        this.apiUrl = apiUrl;
        this.domain = domain;
        this.network = network;
    }
    async createKey(handle, password) {
        const salt = await bsv_1.Hash.asyncSha256(Buffer.from(`${this.domain}|${handle}`));
        const pass = await bsv_1.Hash.asyncSha256(Buffer.from(password.normalize('NFKC')));
        const { hash } = await argon2.hash({ pass, salt, time: 100, mem: 1024, hashLen: 32 });
        return Buffer.from(hash);
    }
    async register(handle, password, email) {
        handle = handle.toLowerCase().normalize('NFKC');
        const keyhash = await this.createKey(handle, password);
        const versionByteNum = this.network === 'main' ?
            bsv_1.Constants.Mainnet.PrivKey.versionByteNum :
            bsv_1.Constants.Testnet.PrivKey.versionByteNum;
        const keybuf = Buffer.concat([
            Buffer.from([versionByteNum]),
            keyhash,
            Buffer.from([1]) // compressed flag
        ]);
        const privKey = new bsv_1.PrivKey().fromBuffer(keybuf);
        const keyPair = bsv_1.KeyPair.fromPrivKey(privKey);
        const pubkey = bsv_1.PubKey.fromPrivKey(privKey);
        const bip32 = bsv_1.Bip32.fromRandom();
        const recoveryBuf = await bsv_1.Ecies.asyncBitcoreEncrypt(Buffer.from(bip32.toString()), pubkey, keyPair);
        const reg = {
            pubkey: pubkey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            email
        };
        const msgBuf = Buffer.from(`${this.domain}|${handle}|${reg.xpub}|${reg.recovery}|${email}`);
        const msgHash = await bsv_1.Hash.asyncSha256(msgBuf);
        const sig = bsv_1.Ecdsa.sign(msgHash, keyPair);
        reg.sig = sig.toString();
        const resp = await node_fetch_1.default(`${this.apiUrl}/api/accounts/${handle}@${this.domain}`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(reg)
        });
        if (!resp.ok) {
            console.error(resp.status, resp.statusText);
            throw new Error('Registration Failed');
        }
        return keyPair;
    }
    async login(handle, password) {
        handle = handle.toLowerCase().normalize('NFKC');
        const keyhash = await this.createKey(handle, password);
        const versionByteNum = this.network === 'main' ?
            bsv_1.Constants.Mainnet.PrivKey.versionByteNum :
            bsv_1.Constants.Testnet.PrivKey.versionByteNum;
        const keybuf = Buffer.concat([
            Buffer.from([versionByteNum]),
            keyhash,
            Buffer.from([1]) // compressed flag
        ]);
        const privKey = new bsv_1.PrivKey().fromBuffer(keybuf);
        return bsv_1.KeyPair.fromPrivKey(privKey);
    }
    async recover(paymail, keyPair) {
        const message = new signed_message_1.SignedMessage({
            from: keyPair.pubKey.toString()
        });
        message.sign(keyPair);
        const resp = await node_fetch_1.default(`${this.apiUrl}/api/accounts/${encodeURIComponent(paymail)}/recover`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(message)
        });
        if (!resp.ok)
            throw new Error(`${resp.status} - ${resp.statusText}`);
        const recovery = await resp.json();
        const recoveryBuf = bsv_1.Ecies.bitcoreDecrypt(Buffer.from(recovery, 'base64'), keyPair.privKey);
        return recoveryBuf.toString();
    }
    async isHandleAvailable(handle) {
        handle = handle.toLowerCase();
        const url = `${this.apiUrl}/api/bsvalias/id/${encodeURIComponent(handle)}@${this.domain}`;
        console.log('Requesting:', url);
        try {
            const resp = await node_fetch_1.default(url);
            return resp.status === 404;
        }
        catch (e) {
            console.error('Error Fetching', e.message);
            return false;
        }
    }
}
exports.KronoAuth = KronoAuth;
//# sourceMappingURL=auth.js.map