**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["interfaces"](../modules/_interfaces_.md) / IJigHistory

# Interface: IJigHistory

## Hierarchy

* **IJigHistory**

## Index

### Methods

* [queryKind](_interfaces_.ijighistory.md#querykind)
* [queryLocation](_interfaces_.ijighistory.md#querylocation)
* [queryOrigin](_interfaces_.ijighistory.md#queryorigin)
* [save](_interfaces_.ijighistory.md#save)

## Methods

### queryKind

▸ **queryKind**(`kind`: string, `query`: [IJigQuery](_interfaces_.ijigquery.md)): Promise\<string[]>

*Defined in [src/interfaces.ts:62](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L62)*

#### Parameters:

Name | Type |
------ | ------ |
`kind` | string |
`query` | [IJigQuery](_interfaces_.ijigquery.md) |

**Returns:** Promise\<string[]>

___

### queryLocation

▸ **queryLocation**(`locs`: string[]): Promise\<[IJig](_interfaces_.ijig.md)[]>

*Defined in [src/interfaces.ts:61](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L61)*

#### Parameters:

Name | Type |
------ | ------ |
`locs` | string[] |

**Returns:** Promise\<[IJig](_interfaces_.ijig.md)[]>

___

### queryOrigin

▸ **queryOrigin**(`origin`: string, `query`: [IJigQuery](_interfaces_.ijigquery.md)): Promise\<string[]>

*Defined in [src/interfaces.ts:63](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L63)*

#### Parameters:

Name | Type |
------ | ------ |
`origin` | string |
`query` | [IJigQuery](_interfaces_.ijigquery.md) |

**Returns:** Promise\<string[]>

___

### save

▸ **save**(`jig`: [IJig](_interfaces_.ijig.md)): Promise\<void>

*Defined in [src/interfaces.ts:60](https://github.com/kronoverse-inc/krono-lib/blob/724f1dc/src/interfaces.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`jig` | [IJig](_interfaces_.ijig.md) |

**Returns:** Promise\<void>
