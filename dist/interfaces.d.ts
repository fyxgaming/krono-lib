export interface IUTXO {
    loc: string;
    address: string;
    txid: string;
    vout: number;
    script: string;
    satoshis: number;
    ts: number;
}
export interface IJig {
    _id?: string;
    location: string;
    owner: string;
    origin: string;
    kind?: string;
    type?: string;
    ts: number;
    isOrigin: boolean;
}
export interface IJigQuery {
    criteria?: {
        [key: string]: any;
    };
    project?: {
        [key: string]: any;
    };
    limit?: number;
    skip?: number;
    sort?: {
        [key: string]: number;
    };
}
export interface IStorage<T> {
    get(key: string): Promise<T>;
    set(key: string, value: T): Promise<void>;
}
