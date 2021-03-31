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
const fyx_axios_1 = __importDefault(require("./fyx-axios"));
const signed_message_1 = require("./signed-message");
const buffer_1 = require("buffer");
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
        const bip39 = bsv_1.Bip39.fromRandom();
        const bip32 = bsv_1.Bip32.fromSeed(bip39.toSeed());
        const recoveryBuf = bsv_1.Ecies.bitcoreEncrypt(bip39.toBuffer(), keyPair.pubKey, keyPair);
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
        await fyx_axios_1.default.post(`${this.apiUrl}/accounts/${id}`, reg);
        return keyPair;
    }
    async recover(id, keyPair) {
        id = id.toLowerCase().normalize('NFKC');
        const { data: { path, recovery } } = await fyx_axios_1.default.post(`${this.apiUrl}/accounts`, new signed_message_1.SignedMessage({ subject: 'Recover' }, id, keyPair));
        const recoveryBuf = bsv_1.Ecies.bitcoreDecrypt(buffer_1.Buffer.from(recovery, 'base64'), keyPair.privKey);
        const bip39 = bsv_1.Bip39.fromBuffer(recoveryBuf);
        return bsv_1.Bip32.fromSeed(bip39.toSeed());
    }
    async isIdAvailable(id) {
        id = id.toLowerCase().normalize('NFKC');
        try {
            const user = await fyx_axios_1.default(`${this.apiUrl}/accounts/${id}`);
            return false;
            ;
        }
        catch (e) {
            if (e.status === 404)
                return true;
            throw e;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map