export declare class JigLoader {
    private redis;
    private run;
    private aws?;
    constructor(redis: any, run: any, aws?: {
        s3: any;
    });
    loadJig(location: any): Promise<any>;
}
