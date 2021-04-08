import { Bip32, KeyPair } from 'bsv';
export declare class AuthService {
    private apiUrl;
    private network;
    constructor(apiUrl: string, network: string);
    generateKeyPair(id: string, password: string): Promise<KeyPair>;
    register(id: string, password: string, email: string, firstName?: string, lastName?: string): Promise<KeyPair>;
    recover(id: string, keyPair: KeyPair): Promise<Bip32>;
    isIdAvailable(id: string): Promise<boolean>;
}
