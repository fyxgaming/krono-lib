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

*Defined in [src/rest-state-cache.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L11)*

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

*Defined in [src/rest-state-cache.ts:14](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L14)*

___

### cache

•  **cache**: { get: (key: string) => any ; set: (key: string, value: any) => any  }

*Defined in [src/rest-state-cache.ts:15](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L15)*

#### Type declaration:

Name | Type |
------ | ------ |
`get` | (key: string) => any |
`set` | (key: string, value: any) => any |

___

### debug

• `Private` **debug**: boolean

*Defined in [src/rest-state-cache.ts:16](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L16)*

___

### fetch

• `Private` **fetch**: any

*Defined in [src/rest-state-cache.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L13)*

___

### requests

• `Private` **requests**: Map\<string, Promise\<any>> = new Map\<string, Promise\<any>>()

*Defined in [src/rest-state-cache.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L11)*

## Methods

### get

▸ **get**(`key`: string): Promise\<any>

*Implementation of [IStorage](../interfaces/_interfaces_.istorage.md)*

*Defined in [src/rest-state-cache.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** Promise\<any>

___

### set

▸ **set**(`key`: string, `value`: any): Promise\<void>

*Defined in [src/rest-state-cache.ts:49](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/rest-state-cache.ts#L49)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |
`value` | any |

**Returns:** Promise\<void>
