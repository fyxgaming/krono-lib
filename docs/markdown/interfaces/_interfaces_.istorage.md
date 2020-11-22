**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["interfaces"](../modules/_interfaces_.md) / IStorage

# Interface: IStorage\<T>

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* **IStorage**

## Implemented by

* [RestStateCache](../classes/_rest_state_cache_.reststatecache.md)

## Index

### Methods

* [get](_interfaces_.istorage.md#get)
* [set](_interfaces_.istorage.md#set)

## Methods

### get

▸ **get**(`key`: string): Promise\<T>

*Defined in [src/interfaces.ts:76](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L76)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** Promise\<T>

___

### set

▸ **set**(`key`: string, `value`: T): Promise\<void>

*Defined in [src/interfaces.ts:77](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L77)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |
`value` | T |

**Returns:** Promise\<void>
