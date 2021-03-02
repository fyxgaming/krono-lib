import { KeyPair } from 'bsv';
export declare class AuthService {
    private apiUrl;
    private network;
    constructor(apiUrl: string, network: string);
    generateKeyPair(id: string, password: string): KeyPair;
    register(id: string, password: string, email: string): Promise<string>;
    recover(id: string, keyPair: KeyPair): Promise<any>;
    isIdAvailable(id: string): Promise<boolean>;
}
