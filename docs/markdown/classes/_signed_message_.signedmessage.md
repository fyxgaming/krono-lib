**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["signed-message"](../modules/_signed_message_.md) / SignedMessage

# Class: SignedMessage

## Hierarchy

* **SignedMessage**

## Index

### Constructors

* [constructor](_signed_message_.signedmessage.md#constructor)

### Properties

* [context](_signed_message_.signedmessage.md#context)
* [from](_signed_message_.signedmessage.md#from)
* [payload](_signed_message_.signedmessage.md#payload)
* [reply](_signed_message_.signedmessage.md#reply)
* [sig](_signed_message_.signedmessage.md#sig)
* [subject](_signed_message_.signedmessage.md#subject)
* [to](_signed_message_.signedmessage.md#to)
* [ts](_signed_message_.signedmessage.md#ts)

### Accessors

* [hash](_signed_message_.signedmessage.md#hash)
* [id](_signed_message_.signedmessage.md#id)
* [payloadObj](_signed_message_.signedmessage.md#payloadobj)

### Methods

* [sign](_signed_message_.signedmessage.md#sign)
* [verify](_signed_message_.signedmessage.md#verify)

## Constructors

### constructor

\+ **new SignedMessage**(`message`: Partial\<[SignedMessage](_signed_message_.signedmessage.md)>): [SignedMessage](_signed_message_.signedmessage.md)

*Defined in [src/signed-message.ts:14](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`message` | Partial\<[SignedMessage](_signed_message_.signedmessage.md)> |

**Returns:** [SignedMessage](_signed_message_.signedmessage.md)

## Properties

### context

•  **context**: string[] = []

*Defined in [src/signed-message.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L11)*

___

### from

•  **from**: string = ""

*Defined in [src/signed-message.ts:7](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L7)*

___

### payload

•  **payload**: string = ""

*Defined in [src/signed-message.ts:12](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L12)*

___

### reply

•  **reply**: string = ""

*Defined in [src/signed-message.ts:9](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L9)*

___

### sig

• `Optional` **sig**: string

*Defined in [src/signed-message.ts:14](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L14)*

___

### subject

•  **subject**: string = ""

*Defined in [src/signed-message.ts:10](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L10)*

___

### to

•  **to**: string[] = []

*Defined in [src/signed-message.ts:8](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L8)*

___

### ts

•  **ts**: number = Date.now()

*Defined in [src/signed-message.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L13)*

## Accessors

### hash

• get **hash**(): any

*Defined in [src/signed-message.ts:20](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L20)*

**Returns:** any

___

### id

• get **id**(): any

*Defined in [src/signed-message.ts:38](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L38)*

**Returns:** any

___

### payloadObj

• get **payloadObj**(): any

*Defined in [src/signed-message.ts:42](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L42)*

**Returns:** any

## Methods

### sign

▸ **sign**(`keyPair`: KeyPair): void

*Defined in [src/signed-message.ts:46](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L46)*

#### Parameters:

Name | Type |
------ | ------ |
`keyPair` | KeyPair |

**Returns:** void

___

### verify

▸ **verify**(): Promise\<any>

*Defined in [src/signed-message.ts:50](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L50)*

**Returns:** Promise\<any>
