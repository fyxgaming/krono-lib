**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["ws-client"](../modules/_ws_client_.md) / WSClient

# Class: WSClient

## Hierarchy

* EventEmitter

  ↳ **WSClient**

## Index

### Constructors

* [constructor](_ws_client_.wsclient.md#constructor)

### Properties

* [channels](_ws_client_.wsclient.md#channels)
* [client](_ws_client_.wsclient.md#client)
* [lastIds](_ws_client_.wsclient.md#lastids)
* [socket](_ws_client_.wsclient.md#socket)
* [url](_ws_client_.wsclient.md#url)
* [defaultMaxListeners](_ws_client_.wsclient.md#defaultmaxlisteners)

### Methods

* [addListener](_ws_client_.wsclient.md#addlistener)
* [close](_ws_client_.wsclient.md#close)
* [connect](_ws_client_.wsclient.md#connect)
* [emit](_ws_client_.wsclient.md#emit)
* [eventNames](_ws_client_.wsclient.md#eventnames)
* [getMaxListeners](_ws_client_.wsclient.md#getmaxlisteners)
* [listenerCount](_ws_client_.wsclient.md#listenercount)
* [listeners](_ws_client_.wsclient.md#listeners)
* [off](_ws_client_.wsclient.md#off)
* [on](_ws_client_.wsclient.md#on)
* [once](_ws_client_.wsclient.md#once)
* [prependListener](_ws_client_.wsclient.md#prependlistener)
* [prependOnceListener](_ws_client_.wsclient.md#prependoncelistener)
* [rawListeners](_ws_client_.wsclient.md#rawlisteners)
* [removeAllListeners](_ws_client_.wsclient.md#removealllisteners)
* [removeListener](_ws_client_.wsclient.md#removelistener)
* [setMaxListeners](_ws_client_.wsclient.md#setmaxlisteners)
* [subscribe](_ws_client_.wsclient.md#subscribe)
* [unsubscribe](_ws_client_.wsclient.md#unsubscribe)
* [listenerCount](_ws_client_.wsclient.md#listenercount)

## Constructors

### constructor

\+ **new WSClient**(`client`: any, `url`: string, `channels?`: string[]): [WSClient](_ws_client_.wsclient.md)

*Overrides void*

*Defined in [src/ws-client.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L11)*

Purpose: creates a new websocket client with an input websocket, URL and a list of channels

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`client` | any | - |
`url` | string | - |
`channels` | string[] | [] |

**Returns:** [WSClient](_ws_client_.wsclient.md)

## Properties

### channels

• `Private` **channels**: Set\<string>

*Defined in [src/ws-client.ts:10](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L10)*

___

### client

• `Private` **client**: any

*Defined in [src/ws-client.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L19)*

___

### lastIds

• `Private` **lastIds**: Map\<string, number> = new Map\<string, number>()

*Defined in [src/ws-client.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L11)*

___

### socket

• `Private` **socket**: any

*Defined in [src/ws-client.ts:9](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L9)*

___

### url

• `Private` **url**: string

*Defined in [src/ws-client.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L19)*

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: number

*Inherited from [Wallet](_wallet_.wallet.md).[defaultMaxListeners](_wallet_.wallet.md#defaultmaxlisteners)*

*Defined in node_modules/@types/node/events.d.ts:45*

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

### close

▸ **close**(): void

*Defined in [src/ws-client.ts:87](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L87)*

Purpose: closes this object's websocket connection

**Returns:** void

___

### connect

▸ **connect**(): any

*Defined in [src/ws-client.ts:31](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L31)*

Purpose: connects this object's websocket client to this object's URL property

**Returns:** any

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

### subscribe

▸ **subscribe**(`channelId`: any, `lastId?`: number): void

*Defined in [src/ws-client.ts:56](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L56)*

Purpose: subscribes this object to the input channel ID

#### Parameters:

Name | Type |
------ | ------ |
`channelId` | any |
`lastId?` | number |

**Returns:** void

___

### unsubscribe

▸ **unsubscribe**(`channelId`: any): void

*Defined in [src/ws-client.ts:72](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/ws-client.ts#L72)*

Purpose: unsubscribes this object from a given channel ID

#### Parameters:

Name | Type |
------ | ------ |
`channelId` | any |

**Returns:** void

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
