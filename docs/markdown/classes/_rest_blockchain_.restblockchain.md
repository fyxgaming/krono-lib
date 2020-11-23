**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["rest-blockchain"](../modules/_rest_blockchain_.md) / RestBlockchain

# Class: RestBlockchain

## Hierarchy

* **RestBlockchain**

## Index

### Constructors

* [constructor](_rest_blockchain_.restblockchain.md#constructor)

### Properties

* [apiUrl](_rest_blockchain_.restblockchain.md#apiurl)
* [cache](_rest_blockchain_.restblockchain.md#cache)
* [debug](_rest_blockchain_.restblockchain.md#debug)
* [fetchLib](_rest_blockchain_.restblockchain.md#fetchlib)
* [network](_rest_blockchain_.restblockchain.md#network)
* [requests](_rest_blockchain_.restblockchain.md#requests)

### Accessors

* [bsvNetwork](_rest_blockchain_.restblockchain.md#bsvnetwork)

### Methods

* [broadcast](_rest_blockchain_.restblockchain.md#broadcast)
* [fetch](_rest_blockchain_.restblockchain.md#fetch)
* [fund](_rest_blockchain_.restblockchain.md#fund)
* [jigIndex](_rest_blockchain_.restblockchain.md#jigindex)
* [jigQuery](_rest_blockchain_.restblockchain.md#jigquery)
* [loadJigData](_rest_blockchain_.restblockchain.md#loadjigdata)
* [loadMessage](_rest_blockchain_.restblockchain.md#loadmessage)
* [populateInputs](_rest_blockchain_.restblockchain.md#populateinputs)
* [sendMessage](_rest_blockchain_.restblockchain.md#sendmessage)
* [spends](_rest_blockchain_.restblockchain.md#spends)
* [time](_rest_blockchain_.restblockchain.md#time)
* [utxos](_rest_blockchain_.restblockchain.md#utxos)

## Constructors

### constructor

\+ **new RestBlockchain**(`fetchLib`: any, `apiUrl`: string, `network`: string, `cache?`: { get: (key: string) => any ; set: (key: string, value: any) => any  }, `debug?`: boolean): [RestBlockchain](_rest_blockchain_.restblockchain.md)

*Defined in [src/rest-blockchain.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L13)*

Purpose: creates a new RestBlockchain object with a fetch library handle, a URL that points to the blockchain data, the network name and
a handle to the local RUN cache. The input parameters are stored as private variables for later reference.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fetchLib` | any | - |
`apiUrl` | string | - |
`network` | string | - |
`cache` | { get: (key: string) => any ; set: (key: string, value: any) => any  } | new Map\<string, any>() |
`debug` | boolean | false |

**Returns:** [RestBlockchain](_rest_blockchain_.restblockchain.md)

## Properties

### apiUrl

• `Private` **apiUrl**: string

*Defined in [src/rest-blockchain.ts:23](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L23)*

___

### cache

•  **cache**: { get: (key: string) => any ; set: (key: string, value: any) => any  }

*Defined in [src/rest-blockchain.ts:25](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L25)*

#### Type declaration:

Name | Type |
------ | ------ |
`get` | (key: string) => any |
`set` | (key: string, value: any) => any |

___

### debug

• `Private` **debug**: boolean

*Defined in [src/rest-blockchain.ts:26](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L26)*

___

### fetchLib

• `Private` **fetchLib**: any

*Defined in [src/rest-blockchain.ts:22](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L22)*

___

### network

•  **network**: string

*Defined in [src/rest-blockchain.ts:24](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L24)*

___

### requests

• `Private` **requests**: Map\<string, Promise\<any>> = new Map\<string, Promise\<any>>()

*Defined in [src/rest-blockchain.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L13)*

## Accessors

### bsvNetwork

• get **bsvNetwork**(): string

*Defined in [src/rest-blockchain.ts:34](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L34)*

Purpose: returns a string indicating whether the current network is mainnet, testnet or a different network

**Returns:** string

## Methods

### broadcast

▸ **broadcast**(`rawtx`: any): Promise\<any>

*Defined in [src/rest-blockchain.ts:50](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L50)*

Purpose: broadcasts a raw transaction to the blockchain

#### Parameters:

Name | Type |
------ | ------ |
`rawtx` | any |

**Returns:** Promise\<any>

___

### fetch

▸ **fetch**(`txid`: string): Promise\<any>

*Defined in [src/rest-blockchain.ts:84](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L84)*

Purpose: given a transaction ID, returns the raw transaction associated with it. The raw transaction is
either retrieved from cache (if present) or is fetched by making a request for the raw transaction associated
with this transaction ID.

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |

**Returns:** Promise\<any>

___

### fund

▸ **fund**(`address`: string, `satoshis?`: number): Promise\<any>

*Defined in [src/rest-blockchain.ts:205](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L205)*

Purpose: given a wallet address, funds the address with the given satoshi value

#### Parameters:

Name | Type |
------ | ------ |
`address` | string |
`satoshis?` | number |

**Returns:** Promise\<any>

___

### jigIndex

▸ **jigIndex**(`address`: string, `kind?`: string, `limit?`: number, `offset?`: number, `includeValue?`: boolean): Promise\<any>

*Defined in [src/rest-blockchain.ts:164](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L164)*

Purpose: returns the JIGs associated with an address based with the ability to filter the response data
based on input parameters.

Default output: returns up to 100 JIGs of all kinds along with their values

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`address` | string | - |
`kind` | string | "" |
`limit` | number | 100 |
`offset` | number | 0 |
`includeValue` | boolean | true |

**Returns:** Promise\<any>

___

### jigQuery

▸ **jigQuery**(`query`: any, `limit?`: number): Promise\<any>

*Defined in [src/rest-blockchain.ts:190](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L190)*

Purpose: given a query object, the JIGs associated with the query input parameters.

Example: const jigData = await blockchain.jigQuery({kind: location}, 10);

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`query` | any | - |
`limit` | number | 10 |

**Returns:** Promise\<any>

___

### loadJigData

▸ **loadJigData**(`loc`: string, `unspent`: boolean): Promise\<any>

*Defined in [src/rest-blockchain.ts:177](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L177)*

Purpose: given a location, returns JIG data associated with that location. The unspent flag controls whether
this method should only return unspent data or all of it.

#### Parameters:

Name | Type |
------ | ------ |
`loc` | string |
`unspent` | boolean |

**Returns:** Promise\<any>

___

### loadMessage

▸ **loadMessage**(`messageId`: any): Promise\<[SignedMessage](_signed_message_.signedmessage.md)>

*Defined in [src/rest-blockchain.ts:216](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L216)*

Purpose: returns a signed message associated with the given messageId

#### Parameters:

Name | Type |
------ | ------ |
`messageId` | any |

**Returns:** Promise\<[SignedMessage](_signed_message_.signedmessage.md)>

___

### populateInputs

▸ **populateInputs**(`tx`: any): Promise\<void>

*Defined in [src/rest-blockchain.ts:70](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L70)*

Purpose: given a transaction object, populates the inputs property of this transaction object
with the outputs of the previous transaction

#### Parameters:

Name | Type |
------ | ------ |
`tx` | any |

**Returns:** Promise\<void>

___

### sendMessage

▸ **sendMessage**(`message`: [SignedMessage](_signed_message_.signedmessage.md), `postTo?`: string): Promise\<any>

*Defined in [src/rest-blockchain.ts:228](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L228)*

Purpose: sends a signed message to the URL path provided by the postTo parm.
If postTo is ommitted, the message is delivered to the generic /messages path

#### Parameters:

Name | Type |
------ | ------ |
`message` | [SignedMessage](_signed_message_.signedmessage.md) |
`postTo?` | string |

**Returns:** Promise\<any>

___

### spends

▸ **spends**(`txid`: string, `vout`: number): Promise\<string \| null>

*Defined in [src/rest-blockchain.ts:125](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L125)*

Purpose: given a transaction ID and an output number, returns the spent amount associated with it. The raw transaction is
either retrieved from cache (if present) or is fetched by making a request for the raw transaction associated
with this transaction ID and output number.

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |
`vout` | number |

**Returns:** Promise\<string \| null>

___

### time

▸ **time**(`txid`: string): Promise\<number>

*Defined in [src/rest-blockchain.ts:108](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L108)*

Purpose: returns the current time

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |

**Returns:** Promise\<number>

___

### utxos

▸ **utxos**(`script`: string): Promise\<[IUTXO](../interfaces/_interfaces_.iutxo.md)[]>

*Defined in [src/rest-blockchain.ts:149](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-blockchain.ts#L149)*

Purpose: returns the Unspent Transaction Outputs (UTXOs) associated with the given input script.

#### Parameters:

Name | Type |
------ | ------ |
`script` | string |

**Returns:** Promise\<[IUTXO](../interfaces/_interfaces_.iutxo.md)[]>
