import createError from 'http-errors';

const { BLOCKCHAIN_BUCKET } = process.env;

export class JigLoader {
    constructor(
        private redis, 
        private run,
        private aws?: { s3: any}
    ) {}

    async loadJig(location) {
        let outputString = await this.redis.get(`jigvalue://${location}`);

        if (!outputString && BLOCKCHAIN_BUCKET) {
            const obj = await this.aws?.s3.getObject({
                Bucket: BLOCKCHAIN_BUCKET || '',
                Key: `jig/${location}`
            }).promise().catch(e => console.log('GetObject Error:', `jig/${location}`, e.message));
            if (obj && obj.Body) {
                outputString = obj.Body.toString('utf8');
                await this.redis.set(`jigvalue://${location}`, outputString);
            }
        }

        let output;
        if (!outputString) {
            const jig = await this.run.load(location);
            if (!jig) throw new createError.NotFound();
            output = {
                ...(typeof jig.toObject === 'function' ? jig.toObject() : jig),
                constructor: {
                    location: jig.constructor.location,
                    origin: jig.constructor.origin,
                    owner: jig.constructor.owner
                },
                ownerKind: typeof jig.owner === 'string' ? 'address' : jig.owner.constructor?.location
            }
            outputString = JSON.stringify(output);

            if (BLOCKCHAIN_BUCKET) await this.aws?.s3.putObject({
                Bucket: BLOCKCHAIN_BUCKET || '',
                Key: `jig/${location}`,
                Body: outputString
            }).promise();
            await this.redis.set(`jigvalue://${location}`, outputString);
        } else {
            output = JSON.parse(outputString);
        }
        return output;
    }
}