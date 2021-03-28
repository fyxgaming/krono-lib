process.env.NETWORK = 'testnet';
global.fetch = require('node-fetch');
const {AuthService} = require('./dist/auth-service');

(async() => {
    const auth = new AuthService('https://dev.aws.kronoverse.io', 'test');
    const keyPair = await auth.generateKeyPair('asdf', 'asdf');
    const bip32 = await auth.recover('asdf', keyPair);
})().catch(e => {
    console.error(e);
}).then(() => process.exit());