export declare class HttpError extends Error {
    status: number;
    constructor(status: number, ...args: any[]);
}
