import { Bip32, KeyPair } from '@ts-bitcoin/core';
export declare class AuthService {
    private apiUrl;
    private network;
    constructor(apiUrl: string, network: string);
    generateKeyPair(id: string, password: string): Promise<KeyPair>;
    register(id: string, password: string, email: string): Promise<KeyPair>;
    recover(id: string, keyPair: KeyPair): Promise<Bip32>;
    isIdAvailable(id: string): Promise<void>;
}
