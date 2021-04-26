import Run from 'run-sdk';
export declare class FyxPurse extends Run.plugins.LocalPurse {
    pay(rawtx: string, parents: {
        satoshis: number;
        script: string;
    }[]): Promise<any>;
}
