**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["wallet"](../modules/_wallet_.md) / Wallet

# Class: Wallet

## Hierarchy

* EventEmitter

  ↳ **Wallet**

## Index

### Constructors

* [constructor](_wallet_.wallet.md#constructor)

### Properties

* [address](_wallet_.wallet.md#address)
* [balance](_wallet_.wallet.md#balance)
* [blockchain](_wallet_.wallet.md#blockchain)
* [createTransaction](_wallet_.wallet.md#createtransaction)
* [getTxPayload](_wallet_.wallet.md#gettxpayload)
* [keyPair](_wallet_.wallet.md#keypair)
* [load](_wallet_.wallet.md#load)
* [loadTransaction](_wallet_.wallet.md#loadtransaction)
* [ownerPair](_wallet_.wallet.md#ownerpair)
* [paymail](_wallet_.wallet.md#paymail)
* [pubkey](_wallet_.wallet.md#pubkey)
* [purse](_wallet_.wallet.md#purse)
* [pursePair](_wallet_.wallet.md#pursepair)
* [timeouts](_wallet_.wallet.md#timeouts)
* [defaultMaxListeners](_wallet_.wallet.md#defaultmaxlisteners)

### Accessors

* [now](_wallet_.wallet.md#now)

### Methods

* [addListener](_wallet_.wallet.md#addlistener)
* [buildMessage](_wallet_.wallet.md#buildmessage)
* [clearTimeout](_wallet_.wallet.md#cleartimeout)
* [decrypt](_wallet_.wallet.md#decrypt)
* [emit](_wallet_.wallet.md#emit)
* [encrypt](_wallet_.wallet.md#encrypt)
* [eventNames](_wallet_.wallet.md#eventnames)
* [getMaxListeners](_wallet_.wallet.md#getmaxlisteners)
* [listenerCount](_wallet_.wallet.md#listenercount)
* [listeners](_wallet_.wallet.md#listeners)
* [loadJig](_wallet_.wallet.md#loadjig)
* [loadJigIndex](_wallet_.wallet.md#loadjigindex)
* [loadJigs](_wallet_.wallet.md#loadjigs)
* [off](_wallet_.wallet.md#off)
* [on](_wallet_.wallet.md#on)
* [once](_wallet_.wallet.md#once)
* [prependListener](_wallet_.wallet.md#prependlistener)
* [prependOnceListener](_wallet_.wallet.md#prependoncelistener)
* [randomBytes](_wallet_.wallet.md#randombytes)
* [randomInt](_wallet_.wallet.md#randomint)
* [rawListeners](_wallet_.wallet.md#rawlisteners)
* [removeAllListeners](_wallet_.wallet.md#removealllisteners)
* [removeListener](_wallet_.wallet.md#removelistener)
* [setMaxListeners](_wallet_.wallet.md#setmaxlisteners)
* [setTimeout](_wallet_.wallet.md#settimeout)
* [signTx](_wallet_.wallet.md#signtx)
* [verifySig](_wallet_.wallet.md#verifysig)
* [listenerCount](_wallet_.wallet.md#listenercount)

## Constructors

### constructor

\+ **new Wallet**(`paymail`: string, `keyPair`: KeyPair, `run`: any): [Wallet](_wallet_.wallet.md)

*Overrides void*

*Defined in [src/wallet.ts:27](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L27)*

Purpose: creates a wallet using a paymail and a KeyPair object, and a reference to a RUN instance

Example:
  const paymail = `${run.owner.address}@localhost`;
  const keyPair = KeyPair.fromPrivKey(PrivKey.fromString(owner));
  const run = new Run({
       network: 'testnet',
       blockchain,
       owner,
       purse,
       state: new LRUCache(100000000)
  });

#### Parameters:

Name | Type |
------ | ------ |
`paymail` | string |
`keyPair` | KeyPair |
`run` | any |

**Returns:** [Wallet](_wallet_.wallet.md)

## Properties

### address

•  **address**: string

*Defined in [src/wallet.ts:15](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L15)*

___

### balance

•  **balance**: () => Promise\<number>

*Defined in [src/wallet.ts:18](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L18)*

___

### blockchain

• `Private` **blockchain**: [RestBlockchain](_rest_blockchain_.restblockchain.md)

*Defined in [src/wallet.ts:14](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L14)*

___

### createTransaction

•  **createTransaction**: () => any

*Defined in [src/wallet.ts:20](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L20)*

___

### getTxPayload

•  **getTxPayload**: (rawtx: string) => any

*Defined in [src/wallet.ts:22](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L22)*

___

### keyPair

• `Private` **keyPair**: KeyPair

*Defined in [src/wallet.ts:47](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L47)*

___

### load

•  **load**: (loc: string) => Promise\<[IJig](../interfaces/_interfaces_.ijig.md)>

*Defined in [src/wallet.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L19)*

___

### loadTransaction

•  **loadTransaction**: (rawtx: string) => Promise\<any>

*Defined in [src/wallet.ts:21](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L21)*

___

### ownerPair

•  **ownerPair**: KeyPair

*Defined in [src/wallet.ts:24](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L24)*

___

### paymail

•  **paymail**: string

*Defined in [src/wallet.ts:46](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L46)*

___

### pubkey

•  **pubkey**: string

*Defined in [src/wallet.ts:17](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L17)*

___

### purse

•  **purse**: string

*Defined in [src/wallet.ts:16](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L16)*

___

### pursePair

•  **pursePair**: KeyPair

*Defined in [src/wallet.ts:25](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L25)*

___

### timeouts

•  **timeouts**: Map\<number, any> = new Map\<number, any>()

*Defined in [src/wallet.ts:27](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L27)*

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: number

*Inherited from [Wallet](_wallet_.wallet.md).[defaultMaxListeners](_wallet_.wallet.md#defaultmaxlisteners)*

*Defined in node_modules/@types/node/events.d.ts:45*

## Accessors

### now

• get **now**(): number

*Defined in [src/wallet.ts:74](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L74)*

Purpose: returns the current date in milliseconds since epoch (see https://currentmillis.com/ for milliseconds since epoch information)

**Returns:** number

## Methods

### addListener

▸ **addListener**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[addListener](_wallet_.wallet.md#addlistener)*

*Defined in node_modules/@types/node/globals.d.ts:569*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### buildMessage

▸ **buildMessage**(`messageData`: Partial\<[SignedMessage](_signed_message_.signedmessage.md)>, `sign?`: boolean): [SignedMessage](_signed_message_.signedmessage.md)

*Defined in [src/wallet.ts:119](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L119)*

Purpose: builds a signed message from a given input message.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`messageData` | Partial\<[SignedMessage](_signed_message_.signedmessage.md)> | - |
`sign` | boolean | true |

**Returns:** [SignedMessage](_signed_message_.signedmessage.md)

___

### clearTimeout

▸ **clearTimeout**(`timeoutId`: number): void

*Defined in [src/wallet.ts:219](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L219)*

Purpose: given a timeout ID, clears it from the stored map of timeouts.

#### Parameters:

Name | Type |
------ | ------ |
`timeoutId` | number |

**Returns:** void

___

### decrypt

▸ **decrypt**(`value`: any): Promise\<void>

*Defined in [src/wallet.ts:165](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L165)*

Purpose: Reserved for a future implementation.

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |

**Returns:** Promise\<void>

___

### emit

▸ **emit**(`event`: string \| symbol, ...`args`: any[]): boolean

*Inherited from [Wallet](_wallet_.wallet.md).[emit](_wallet_.wallet.md#emit)*

*Defined in node_modules/@types/node/globals.d.ts:579*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`...args` | any[] |

**Returns:** boolean

___

### encrypt

▸ **encrypt**(`pubkey`: string): Promise\<void>

*Defined in [src/wallet.ts:156](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L156)*

Purpose: Reserved for a future implementation.

#### Parameters:

Name | Type |
------ | ------ |
`pubkey` | string |

**Returns:** Promise\<void>

___

### eventNames

▸ **eventNames**(): Array\<string \| symbol>

*Inherited from [Wallet](_wallet_.wallet.md).[eventNames](_wallet_.wallet.md#eventnames)*

*Defined in node_modules/@types/node/globals.d.ts:584*

**Returns:** Array\<string \| symbol>

___

### getMaxListeners

▸ **getMaxListeners**(): number

*Inherited from [Wallet](_wallet_.wallet.md).[getMaxListeners](_wallet_.wallet.md#getmaxlisteners)*

*Defined in node_modules/@types/node/globals.d.ts:576*

**Returns:** number

___

### listenerCount

▸ **listenerCount**(`type`: string \| symbol): number

*Inherited from [Wallet](_wallet_.wallet.md).[listenerCount](_wallet_.wallet.md#listenercount)*

*Defined in node_modules/@types/node/globals.d.ts:580*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string \| symbol |

**Returns:** number

___

### listeners

▸ **listeners**(`event`: string \| symbol): Function[]

*Inherited from [Wallet](_wallet_.wallet.md).[listeners](_wallet_.wallet.md#listeners)*

*Defined in node_modules/@types/node/globals.d.ts:577*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** Function[]

___

### loadJig

▸ **loadJig**(`loc`: string): Promise\<[IJig](../interfaces/_interfaces_.ijig.md) \| void>

*Defined in [src/wallet.ts:93](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L93)*

Purpose: loads and returns a JIG associated with a specific location string.

#### Parameters:

Name | Type |
------ | ------ |
`loc` | string |

**Returns:** Promise\<[IJig](../interfaces/_interfaces_.ijig.md) \| void>

___

### loadJigIndex

▸ **loadJigIndex**(`kind?`: string, `limit?`: number, `offset?`: number, `includeValue?`: boolean): Promise\<any>

*Defined in [src/wallet.ts:84](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L84)*

Purpose: returns the JIGs associated with this wallet's address. Any data filtering options can be supplied as input parameters.

Invokes RestBlockchain.jigIndex

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`kind` | string | "" |
`limit` | number | 100 |
`offset` | number | 0 |
`includeValue` | boolean | true |

**Returns:** Promise\<any>

___

### loadJigs

▸ **loadJigs**(): Promise\<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>

*Defined in [src/wallet.ts:107](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L107)*

Purpose: loads and returns all the JIGs associated with this wallet's address.

**Returns:** Promise\<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>

___

### off

▸ **off**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[off](_wallet_.wallet.md#off)*

*Defined in node_modules/@types/node/globals.d.ts:573*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### on

▸ **on**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[on](_wallet_.wallet.md#on)*

*Defined in node_modules/@types/node/globals.d.ts:570*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### once

▸ **once**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[once](_wallet_.wallet.md#once)*

*Defined in node_modules/@types/node/globals.d.ts:571*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### prependListener

▸ **prependListener**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[prependListener](_wallet_.wallet.md#prependlistener)*

*Defined in node_modules/@types/node/globals.d.ts:582*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### prependOnceListener

▸ **prependOnceListener**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[prependOnceListener](_wallet_.wallet.md#prependoncelistener)*

*Defined in node_modules/@types/node/globals.d.ts:583*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### randomBytes

▸ **randomBytes**(`size`: number): string

*Defined in [src/wallet.ts:195](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L195)*

Purpose: generates a random bytes buffer of a given input size.

#### Parameters:

Name | Type |
------ | ------ |
`size` | number |

**Returns:** string

___

### randomInt

▸ **randomInt**(`max`: any): number

*Defined in [src/wallet.ts:186](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L186)*

Purpose: generates a random integer given an upper limit.

#### Parameters:

Name | Type |
------ | ------ |
`max` | any |

**Returns:** number

___

### rawListeners

▸ **rawListeners**(`event`: string \| symbol): Function[]

*Inherited from [Wallet](_wallet_.wallet.md).[rawListeners](_wallet_.wallet.md#rawlisteners)*

*Defined in node_modules/@types/node/globals.d.ts:578*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** Function[]

___

### removeAllListeners

▸ **removeAllListeners**(`event?`: string \| symbol): this

*Inherited from [Wallet](_wallet_.wallet.md).[removeAllListeners](_wallet_.wallet.md#removealllisteners)*

*Defined in node_modules/@types/node/globals.d.ts:574*

#### Parameters:

Name | Type |
------ | ------ |
`event?` | string \| symbol |

**Returns:** this

___

### removeListener

▸ **removeListener**(`event`: string \| symbol, `listener`: (...args: any[]) => void): this

*Inherited from [Wallet](_wallet_.wallet.md).[removeListener](_wallet_.wallet.md#removelistener)*

*Defined in node_modules/@types/node/globals.d.ts:572*

#### Parameters:

Name | Type |
------ | ------ |
`event` | string \| symbol |
`listener` | (...args: any[]) => void |

**Returns:** this

___

### setMaxListeners

▸ **setMaxListeners**(`n`: number): this

*Inherited from [Wallet](_wallet_.wallet.md).[setMaxListeners](_wallet_.wallet.md#setmaxlisteners)*

*Defined in node_modules/@types/node/globals.d.ts:575*

#### Parameters:

Name | Type |
------ | ------ |
`n` | number |

**Returns:** this

___

### setTimeout

▸ **setTimeout**(`cb`: () => Promise\<void>, `ms`: number): number

*Defined in [src/wallet.ts:205](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L205)*

Purpose: given a callback and milliseconds as input, creates a timeout ID and waits for the input milliseconds and returns the timeout ID.
This reimplements Node.js setTimeout method. Both the ID and the timeout output are stored to a map for audit purposes.

#### Parameters:

Name | Type |
------ | ------ |
`cb` | () => Promise\<void> |
`ms` | number |

**Returns:** number

___

### signTx

▸ **signTx**(`tx`: Tx): Promise\<TxOut[]>

*Defined in [src/wallet.ts:132](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L132)*

Purpose: signs an input transaction and returns the signed form of the input transaction.

#### Parameters:

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** Promise\<TxOut[]>

___

### verifySig

▸ **verifySig**(`sig`: any, `hash`: any, `pubkey`: any): Promise\<boolean>

*Defined in [src/wallet.ts:174](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/wallet.ts#L174)*

Purpose: given a signature, hash of a transaction and a public key, verifies that the signature on the transaction hash is valid.

#### Parameters:

Name | Type |
------ | ------ |
`sig` | any |
`hash` | any |
`pubkey` | any |

**Returns:** Promise\<boolean>

___

### listenerCount

▸ `Static`**listenerCount**(`emitter`: EventEmitter, `event`: string \| symbol): number

*Inherited from [Wallet](_wallet_.wallet.md).[listenerCount](_wallet_.wallet.md#listenercount)*

*Defined in node_modules/@types/node/events.d.ts:44*

**`deprecated`** since v4.0.0

#### Parameters:

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string \| symbol |

**Returns:** number
