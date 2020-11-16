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

*Defined in [src/rest-blockchain.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L13)*

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

*Defined in [src/rest-blockchain.ts:16](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L16)*

___

### cache

•  **cache**: { get: (key: string) => any ; set: (key: string, value: any) => any  }

*Defined in [src/rest-blockchain.ts:18](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L18)*

#### Type declaration:

Name | Type |
------ | ------ |
`get` | (key: string) => any |
`set` | (key: string, value: any) => any |

___

### debug

• `Private` **debug**: boolean

*Defined in [src/rest-blockchain.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L19)*

___

### fetchLib

• `Private` **fetchLib**: any

*Defined in [src/rest-blockchain.ts:15](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L15)*

___

### network

•  **network**: string

*Defined in [src/rest-blockchain.ts:17](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L17)*

___

### requests

• `Private` **requests**: Map\<string, Promise\<any>> = new Map\<string, Promise\<any>>()

*Defined in [src/rest-blockchain.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L13)*

## Accessors

### bsvNetwork

• get **bsvNetwork**(): string

*Defined in [src/rest-blockchain.ts:22](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L22)*

**Returns:** string

## Methods

### broadcast

▸ **broadcast**(`rawtx`: any): Promise\<any>

*Defined in [src/rest-blockchain.ts:33](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L33)*

#### Parameters:

Name | Type |
------ | ------ |
`rawtx` | any |

**Returns:** Promise\<any>

___

### fetch

▸ **fetch**(`txid`: string): Promise\<any>

*Defined in [src/rest-blockchain.ts:54](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L54)*

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |

**Returns:** Promise\<any>

___

### fund

▸ **fund**(`address`: string, `satoshis?`: number): Promise\<any>

*Defined in [src/rest-blockchain.ts:132](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L132)*

#### Parameters:

Name | Type |
------ | ------ |
`address` | string |
`satoshis?` | number |

**Returns:** Promise\<any>

___

### jigIndex

▸ **jigIndex**(`address`: string, `kind?`: string, `limit?`: number, `offset?`: number, `includeValue?`: boolean): Promise\<any>

*Defined in [src/rest-blockchain.ts:109](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L109)*

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

*Defined in [src/rest-blockchain.ts:122](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L122)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`query` | any | - |
`limit` | number | 10 |

**Returns:** Promise\<any>

___

### loadJigData

▸ **loadJigData**(`loc`: string, `unspent`: boolean): Promise\<any>

*Defined in [src/rest-blockchain.ts:116](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L116)*

#### Parameters:

Name | Type |
------ | ------ |
`loc` | string |
`unspent` | boolean |

**Returns:** Promise\<any>

___

### loadMessage

▸ **loadMessage**(`messageId`: any): Promise\<[SignedMessage](_signed_message_.signedmessage.md)>

*Defined in [src/rest-blockchain.ts:138](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L138)*

#### Parameters:

Name | Type |
------ | ------ |
`messageId` | any |

**Returns:** Promise\<[SignedMessage](_signed_message_.signedmessage.md)>

___

### populateInputs

▸ **populateInputs**(`tx`: any): Promise\<void>

*Defined in [src/rest-blockchain.ts:47](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`tx` | any |

**Returns:** Promise\<void>

___

### sendMessage

▸ **sendMessage**(`message`: [SignedMessage](_signed_message_.signedmessage.md), `postTo?`: string): Promise\<any>

*Defined in [src/rest-blockchain.ts:144](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`message` | [SignedMessage](_signed_message_.signedmessage.md) |
`postTo?` | string |

**Returns:** Promise\<any>

___

### spends

▸ **spends**(`txid`: string, `vout`: number): Promise\<string \| null>

*Defined in [src/rest-blockchain.ts:83](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L83)*

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |
`vout` | number |

**Returns:** Promise\<string \| null>

___

### time

▸ **time**(`txid`: string): Promise\<number>

*Defined in [src/rest-blockchain.ts:73](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L73)*

#### Parameters:

Name | Type |
------ | ------ |
`txid` | string |

**Returns:** Promise\<number>

___

### utxos

▸ **utxos**(`script`: string): Promise\<[IUTXO](../interfaces/_interfaces_.iutxo.md)[]>

*Defined in [src/rest-blockchain.ts:102](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-blockchain.ts#L102)*

#### Parameters:

Name | Type |
------ | ------ |
`script` | string |

**Returns:** Promise\<[IUTXO](../interfaces/_interfaces_.iutxo.md)[]>
