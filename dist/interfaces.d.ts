export interface IUTXO {
    loc: string;
    address: string;
    txid: string;
    vout: number;
    script: string;
    satoshis: number;
    ts: number;
}
export interface IStorage<T> {
    get(key: string): Promise<T>;
    set(key: string, value: T): Promise<void>;
}
