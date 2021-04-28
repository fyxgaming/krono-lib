process.env.NETWORK = 'testnet';
const {RestBlockchain} = require('../dist/rest-blockchain');
const {RestStateCache} = require('../dist/rest-state-cache');
const {AuthService} = require('../dist/auth-service');
const {FyxOwner} = require('../dist/fyx-owner');
const {FyxPurse} = require('../dist/fyx-purse');
const Run = require('run-sdk');

API = 'https://test.aws.kronoverse.io';
USER = 'abelium'
PASS = 'test1234'
LOC = 'ba33677f44a4170085de4693bf2b0563c11cbcdf87225f2e6a7b872f6facc5da_o2';

Promise.resolve().then(async () => {
    const auth = new AuthService(API, 'test');
    const keyPair = await auth.generateKeyPair(USER, PASS);
    const bip32 = await auth.recover(USER, keyPair);
    const cache = new RestStateCache(API, new Run.plugins.LocalCache())
    const blockchain = new RestBlockchain(API, 'test', cache);
    const owner = new FyxOwner(API, bip32, 'cryptofights', USER, keyPair);
    const purse = new FyxPurse({blockchain, privkey: keyPair.privKey.toString()})
    const run = new Run({blockchain, owner, purse, cache, trust: '*'});
    const jig = await run.load(LOC);
    console.log(jig.toObject());
    const [txid, vout] = LOC.split('_o');
    const utxos = await purse.utxos();

    const t = new Run.Transaction();
    const address = await owner.nextOwner();
    t.base = await owner.getPurchaseBase(jig.owner);
    t.update(() => jig.send(address));
    let rawtx = await t.export({sign: true, pay: true});
    const lockRawTx = await blockchain.fetch(txid);
    rawtx = await owner.signOrderLock(rawtx, lockRawTx, false);
    console.log('RawTX:', rawtx);
    await blockchain.broadcast(rawtx);

}).catch(console.error).then(() => process.exit());
