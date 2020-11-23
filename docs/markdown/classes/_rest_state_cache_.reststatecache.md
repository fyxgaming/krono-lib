**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["rest-state-cache"](../modules/_rest_state_cache_.md) / RestStateCache

# Class: RestStateCache

## Hierarchy

* **RestStateCache**

## Implements

* [IStorage](../interfaces/_interfaces_.istorage.md)\<any>

## Index

### Constructors

* [constructor](_rest_state_cache_.reststatecache.md#constructor)

### Properties

* [apiUrl](_rest_state_cache_.reststatecache.md#apiurl)
* [cache](_rest_state_cache_.reststatecache.md#cache)
* [debug](_rest_state_cache_.reststatecache.md#debug)
* [fetch](_rest_state_cache_.reststatecache.md#fetch)
* [requests](_rest_state_cache_.reststatecache.md#requests)

### Methods

* [get](_rest_state_cache_.reststatecache.md#get)
* [set](_rest_state_cache_.reststatecache.md#set)

## Constructors

### constructor

\+ **new RestStateCache**(`fetch`: any, `apiUrl`: string, `cache?`: { get: (key: string) => any ; set: (key: string, value: any) => any  }, `debug?`: boolean): [RestStateCache](_rest_state_cache_.reststatecache.md)

*Defined in [src/rest-state-cache.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L11)*

Purpose: creates a new RestStateCache object with a fetch library handle, a URL that points to the blockchain data and
a handle to the local RUN cache. The input parameters are stored as private variables for later reference.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`fetch` | any | - |
`apiUrl` | string | - |
`cache` | { get: (key: string) => any ; set: (key: string, value: any) => any  } | new Map\<string, any>() |
`debug` | boolean | false |

**Returns:** [RestStateCache](_rest_state_cache_.reststatecache.md)

## Properties

### apiUrl

• `Private` **apiUrl**: string

*Defined in [src/rest-state-cache.ts:21](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L21)*

___

### cache

•  **cache**: { get: (key: string) => any ; set: (key: string, value: any) => any  }

*Defined in [src/rest-state-cache.ts:22](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L22)*

#### Type declaration:

Name | Type |
------ | ------ |
`get` | (key: string) => any |
`set` | (key: string, value: any) => any |

___

### debug

• `Private` **debug**: boolean

*Defined in [src/rest-state-cache.ts:23](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L23)*

___

### fetch

• `Private` **fetch**: any

*Defined in [src/rest-state-cache.ts:20](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L20)*

___

### requests

• `Private` **requests**: Map\<string, Promise\<any>> = new Map\<string, Promise\<any>>()

*Defined in [src/rest-state-cache.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L11)*

## Methods

### get

▸ **get**(`key`: string): Promise\<any>

*Implementation of [IStorage](../interfaces/_interfaces_.istorage.md)*

*Defined in [src/rest-state-cache.ts:31](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L31)*

Purpose: given a cache key, returns the value associated with the key from the RestStateCache object

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** Promise\<any>

___

### set

▸ **set**(`key`: string, `value`: any): Promise\<void>

*Defined in [src/rest-state-cache.ts:66](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/rest-state-cache.ts#L66)*

Purpose: given a key and value input parameters, sets up a key-value pair based map in the RestStateCache object.

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |
`value` | any |

**Returns:** Promise\<void>
