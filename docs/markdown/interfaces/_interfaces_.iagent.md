**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["interfaces"](../modules/_interfaces_.md) / IAgent

# Interface: IAgent

## Hierarchy

* **IAgent**

## Index

### Methods

* [onEvent](_interfaces_.iagent.md#onevent)
* [onJig](_interfaces_.iagent.md#onjig)
* [onMessage](_interfaces_.iagent.md#onmessage)

## Methods

### onEvent

▸ **onEvent**(`type`: string, `payload`: any): Promise\<any>

*Defined in [src/interfaces.ts:21](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/interfaces.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |
`payload` | any |

**Returns:** Promise\<any>

___

### onJig

▸ **onJig**(`jigData`: [IJigData](_interfaces_.ijigdata.md)): Promise\<any>

*Defined in [src/interfaces.ts:16](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/interfaces.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`jigData` | [IJigData](_interfaces_.ijigdata.md) |

**Returns:** Promise\<any>

___

### onMessage

▸ **onMessage**(`message`: [SignedMessage](../classes/_signed_message_.signedmessage.md)): Promise\<any>

*Defined in [src/interfaces.ts:22](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/interfaces.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`message` | [SignedMessage](../classes/_signed_message_.signedmessage.md) |

**Returns:** Promise\<any>
