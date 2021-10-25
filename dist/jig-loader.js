"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JigLoader = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const { BLOCKCHAIN_BUCKET } = process.env;
class JigLoader {
    constructor(redis, run, aws) {
        this.redis = redis;
        this.run = run;
        this.aws = aws;
    }
    async loadJig(location) {
        var _a, _b, _c;
        let outputString = await this.redis.get(`jigvalue://${location}`);
        if (!outputString && BLOCKCHAIN_BUCKET) {
            const obj = await ((_a = this.aws) === null || _a === void 0 ? void 0 : _a.s3.getObject({
                Bucket: BLOCKCHAIN_BUCKET || '',
                Key: `jig/${location}`
            }).promise().catch(e => console.log('GetObject Error:', `jig/${location}`, e.message)));
            if (obj && obj.Body) {
                outputString = obj.Body.toString('utf8');
                await this.redis.set(`jigvalue://${location}`, outputString);
            }
        }
        let output;
        if (!outputString) {
            const jig = await this.run.load(location);
            if (!jig)
                throw new http_errors_1.default.NotFound();
            output = {
                ...(typeof jig.toObject === 'function' ? jig.toObject() : jig),
                constructor: {
                    location: jig.constructor.location,
                    origin: jig.constructor.origin,
                    owner: jig.constructor.owner
                },
                ownerKind: typeof jig.owner === 'string' ? 'address' : (_b = jig.owner.constructor) === null || _b === void 0 ? void 0 : _b.location
            };
            outputString = JSON.stringify(output);
            if (BLOCKCHAIN_BUCKET)
                await ((_c = this.aws) === null || _c === void 0 ? void 0 : _c.s3.putObject({
                    Bucket: BLOCKCHAIN_BUCKET || '',
                    Key: `jig/${location}`,
                    Body: outputString
                }).promise());
            await this.redis.set(`jigvalue://${location}`, outputString);
        }
        else {
            output = JSON.parse(outputString);
        }
        return output;
    }
}
exports.JigLoader = JigLoader;
//# sourceMappingURL=jig-loader.js.map