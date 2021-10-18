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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
const signed_message_1 = require("./signed-message");
const buffer_1 = require("buffer");
class AuthService {
    constructor(apiUrl, network) {
        this.apiUrl = apiUrl;
        this.network = network.slice(0, 4);
    }
    async generateKeyPair(id, password) {
        id = id.toLowerCase().normalize('NFKC');
        const salt = bsv_1.Hash.sha256(buffer_1.Buffer.concat([buffer_1.Buffer.from(this.network), buffer_1.Buffer.from(id)]));
        const pass = bsv_1.Hash.sha256(buffer_1.Buffer.from(password.normalize('NFKC')));
        const { hash } = await argon2.hash({ pass, salt, time: 100, mem: 1024, hashLen: 32 });
        if (!(new bsv_1.Bn().fromBuffer(buffer_1.Buffer.from(hash)).lt(bsv_1.Point.getN()))) {
            throw new Error('BigInteger is out of range of valid private keys');
        }
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
    async register(id, password, email, firstName = '', lastName = '') {
        id = id.toLowerCase().normalize('NFKC');
        const keyPair = await this.generateKeyPair(id, password);
        const bip39 = bsv_1.Bip39.fromRandom();
        const bip32 = bsv_1.Bip32.fromSeed(bip39.toSeed());
        const recoveryBuf = bsv_1.Ecies.bitcoreEncrypt(bip39.toBuffer(), keyPair.pubKey, keyPair);
        const reg = {
            pubkey: keyPair.pubKey.toString(),
            xpub: bip32.toPublic().toString(),
            recovery: recoveryBuf.toString('base64'),
            firstName,
            lastName,
            email
        };
        let msgBuf = buffer_1.Buffer.from(`${id}|${reg.xpub}|${reg.recovery}|${email}`);
        if (firstName)
            msgBuf = buffer_1.Buffer.concat([msgBuf, buffer_1.Buffer.from(`|${firstName}`)]);
        if (lastName)
            msgBuf = buffer_1.Buffer.concat([msgBuf, buffer_1.Buffer.from(`|${lastName}`)]);
        const msgHash = await bsv_1.Hash.asyncSha256(msgBuf);
        const sig = bsv_1.Ecdsa.sign(msgHash, keyPair);
        reg.sig = sig.toString();
        await fyx_axios_1.default.post(`${this.apiUrl}/accounts/${id}`, reg);
        return keyPair;
    }
    async recoverBip39(id, keyPair) {
        id = id.toLowerCase().normalize('NFKC');
        const { data: { path, recovery } } = await fyx_axios_1.default.post(`${this.apiUrl}/accounts/${id}/recover`, new signed_message_1.SignedMessage({ subject: 'recover' }, id, keyPair));
        const recoveryBuf = bsv_1.Ecies.bitcoreDecrypt(buffer_1.Buffer.from(recovery, 'base64'), keyPair.privKey);
        return bsv_1.Bip39.fromBuffer(recoveryBuf);
    }
    async recover(id, keyPair) {
        const bip39 = await this.recoverBip39(id, keyPair);
        return bsv_1.Bip32.fromSeed(bip39.toSeed());
    }
    async mnemonic(id, keyPair) {
        const bip39 = await this.recoverBip39(id, keyPair);
        return bip39.toString();
    }
    async getProfile(id, keyPair) {
        id = id.toLowerCase().normalize('NFKC');
        const { data: user } = await fyx_axios_1.default.post(`${this.apiUrl}/accounts/${id}/recover`, new signed_message_1.SignedMessage({ subject: 'recover' }, id, keyPair));
        return user;
    }
    async rekey(mnemonic, id, password) {
        const bip39 = bsv_1.Bip39.fromString(mnemonic);
        const bip32 = bsv_1.Bip32.fromSeed(bip39.toSeed());
        const keyPair = await this.generateKeyPair(id, password);
        const recoveryBuf = bsv_1.Ecies.bitcoreEncrypt(bip39.toBuffer(), keyPair.pubKey, keyPair);
        await fyx_axios_1.default.put(`${this.apiUrl}/accounts/${id}`, new signed_message_1.SignedMessage({
            subject: 'rekey',
            payload: JSON.stringify({
                pubkey: keyPair.pubKey.toString(),
                recovery: recoveryBuf.toString('base64'),
                xpub: bip32.toPublic().toString()
            })
        }, id, bsv_1.KeyPair.fromPrivKey(bip32.privKey)));
        return keyPair;
    }
    async isIdAvailable(id) {
        id = id.toLowerCase().normalize('NFKC');
        try {
            const user = await (0, fyx_axios_1.default)(`${this.apiUrl}/accounts/${id}`);
            return false;
        }
        catch (e) {
            if (e.status === 404)
                return true;
            throw e;
        }
    }
    async verifyEmail(id, nonce) {
        try {
            await fyx_axios_1.default.post(`${this.apiUrl}/accounts/emails/verify/${id}/${nonce}`);
            return true;
        }
        catch (e) {
            if (e.status === 401)
                return false;
            throw e;
        }
    }
    async requestVerificationEmail(id) {
        await fyx_axios_1.default.post(`${this.apiUrl}/accounts/emails/generate/${id}`);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map