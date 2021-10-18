import { Bip32, KeyPair } from 'bsv';
export declare class AuthService {
    private apiUrl;
    private network;
    constructor(apiUrl: string, network: string);
    generateKeyPair(id: string, password: string): Promise<KeyPair>;
    register(id: string, password: string, email: string, firstName?: string, lastName?: string): Promise<KeyPair>;
    recoverBip39(id: string, keyPair: KeyPair): Promise<Bip32>;
    recover(id: string, keyPair: KeyPair): Promise<Bip32>;
    mnemonic(id: string, keyPair: KeyPair): Promise<string>;
    getProfile(id: string, keyPair: KeyPair): Promise<Bip32>;
    rekey(mnemonic: string, id: string, password: string): Promise<KeyPair>;
    isIdAvailable(id: string): Promise<boolean>;
    verifyEmail(id: string, nonce: string): Promise<boolean>;
    requestVerificationEmail(id: any): Promise<void>;
}
