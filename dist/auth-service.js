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
exports.AuthService = void 0;
const argon2 = __importStar(require("argon2-browser"));
const bsv_1 = require("bsv");
const signed_message_1 = require("./signed-message");
const buffer_1 = require("buffer");
const http_errors_1 = __importDefault(require("http-errors"));
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
        // const versionByteNum = this.network === 'main' ?
        //     Constants.Mainnet.PrivKey.versionByteNum :
        //     Constants.Testnet.PrivKey.versionByteNum;
        // const keybuf = Buffer.concat([
        //     Buffer.from([versionByteNum]),
        //     Buffer.from(hash),
        //     Buffer.from([1]) // compressed flag
        // ]);
        const bip39 = bsv_1.Bip39.fromEntropy(buffer_1.Buffer.from(hash));
        return bsv_1.Bip32.fromSeed(bip39.toSeed());
    }
    async register(id, password, email) {
        const bip32 = await this.generateKeyPair(id, password);
        const keyPair = bsv_1.KeyPair.fromPrivKey(bip32.privKey);
        const recoveryBuf = bsv_1.Ecies.bitcoreEncrypt(buffer_1.Buffer.from(bip32.toString()), keyPair.pubKey, keyPair);
        const reg = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            email
        };
        const resp = await fetch(`${this.apiUrl}/accounts`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(new signed_message_1.SignedMessage({
                subject: 'Register',
                payload: JSON.stringify({
                    id,
                    xpub: bip32.toPublic().toString(),
                    recovery: recoveryBuf.toString('base64'),
                    email
                })
            }, keyPair))
        });
        if (!resp.ok)
            throw http_errors_1.default(resp.status, resp.statusText);
        return bip32;
    }
    // async recover(id: string, keyPair: KeyPair) {
    //     const resp = await fetch(`${this.apiUrl}/accounts`, {
    //         method: 'POST', 
    //         headers: {'Content-type': 'application/json'},
    //         body: JSON.stringify(new SignedMessage({
    //             subject: 'Recover'
    //         }, keyPair))
    //     });
    //     if(!resp.ok) throw createError(resp.status, resp.statusText);
    //     const {path, recovery} = await resp.json();
    //     const recoveryBuf = Ecies.bitcoreDecrypt(
    //         Buffer.from(recovery, 'base64'),
    //         keyPair.privKey
    //     );
    //     return {
    //         xpriv: recoveryBuf.toString(),
    //         path
    //     };
    // }
    async isIdAvailable(id) {
        try {
            const resp = await fetch(`${this.apiUrl}/accounts/${id}`);
            if (!resp.ok && resp.status !== 404)
                throw http_errors_1.default(resp.status, resp.statusText);
            return resp.status === 404;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map