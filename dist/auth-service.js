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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const argon2 = __importStar(require("argon2-browser"));
const bsv_1 = require("bsv");
const signed_message_1 = require("./signed-message");
const buffer_1 = require("buffer");
const http_error_1 = require("./http-error");
class AuthService {
    constructor(apiUrl, network) {
        this.apiUrl = apiUrl;
        this.network = network;
    }
    async generateKeyPair(id, password) {
        id = id.toLowerCase().normalize('NFKC');
        const salt = bsv_1.Hash.sha256(buffer_1.Buffer.from(id));
        const pass = bsv_1.Hash.sha256(buffer_1.Buffer.from(password.normalize('NFKC')));
        const { hash } = await argon2.hash({ pass, salt, time: 100, mem: 1024, hashLen: 32 });
        const versionByteNum = this.network === 'main' ?
            bsv_1.Constants.Mainnet.PrivKey.versionByteNum :
            bsv_1.Constants.Testnet.PrivKey.versionByteNum;
        const keybuf = buffer_1.Buffer.concat([
            buffer_1.Buffer.from([versionByteNum]),
            buffer_1.Buffer.from(hash),
            buffer_1.Buffer.from([1]) // compressed flag
        ]);
        const privKey = bsv_1.PrivKey.fromBuffer(keybuf);
        return bsv_1.KeyPair.fromPrivKey(privKey);
    }
    async register(id, password, email) {
        id = id.toLowerCase().normalize('NFKC');
        const keyPair = await this.generateKeyPair(id, password);
        const bip32 = bsv_1.Bip32.fromRandom();
        const recoveryBuf = bsv_1.Ecies.bitcoreEncrypt(buffer_1.Buffer.from(bip32.toString()), keyPair.pubKey, keyPair);
        const reg = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            email
        };
        const msgBuf = buffer_1.Buffer.from(`${id}|${reg.xpub}|${reg.recovery}|${email}`);
        const msgHash = await bsv_1.Hash.asyncSha256(msgBuf);
        const sig = bsv_1.Ecdsa.sign(msgHash, keyPair);
        reg.sig = sig.toString();
        const resp = await fetch(`${this.apiUrl}/accounts/${id}`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(reg)
        });
        if (!resp.ok)
            throw new http_error_1.HttpError(resp.status, resp.statusText);
        return keyPair;
    }
    async recover(id, keyPair) {
        id = id.toLowerCase().normalize('NFKC');
        const resp = await fetch(`${this.apiUrl}/accounts`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(new signed_message_1.SignedMessage({
                subject: 'Recover'
            }, id, keyPair))
        });
        if (!resp.ok)
            throw new http_error_1.HttpError(resp.status, resp.statusText);
        const { path, recovery } = await resp.json();
        const recoveryBuf = bsv_1.Ecies.bitcoreDecrypt(buffer_1.Buffer.from(recovery, 'base64'), keyPair.privKey);
        const xpriv = recoveryBuf.toString();
        return bsv_1.Bip32.fromString(xpriv);
    }
    async isIdAvailable(id) {
        id = id.toLowerCase().normalize('NFKC');
        try {
            const resp = await fetch(`${this.apiUrl}/accounts/${id}`);
            if (!resp.ok && resp.status !== 404)
                throw new http_error_1.HttpError(resp.status, resp.statusText);
            return resp.status === 404;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map