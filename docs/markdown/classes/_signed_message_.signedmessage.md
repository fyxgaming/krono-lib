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

*Defined in [src/signed-message.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L19)*

Purpose: creates a new SignedMessage object with a fully or partially defined input SignedMessage object

#### Parameters:

Name | Type |
------ | ------ |
`message` | Partial\<[SignedMessage](_signed_message_.signedmessage.md)> |

**Returns:** [SignedMessage](_signed_message_.signedmessage.md)

## Properties

### context

•  **context**: string[] = []

*Defined in [src/signed-message.ts:16](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L16)*

___

### from

•  **from**: string = ""

*Defined in [src/signed-message.ts:12](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L12)*

___

### payload

•  **payload**: string = ""

*Defined in [src/signed-message.ts:17](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L17)*

___

### reply

•  **reply**: string = ""

*Defined in [src/signed-message.ts:14](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L14)*

___

### sig

• `Optional` **sig**: string

*Defined in [src/signed-message.ts:19](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L19)*

___

### subject

•  **subject**: string = ""

*Defined in [src/signed-message.ts:15](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L15)*

___

### to

•  **to**: string[] = []

*Defined in [src/signed-message.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L13)*

___

### ts

•  **ts**: number = Date.now()

*Defined in [src/signed-message.ts:18](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L18)*

## Accessors

### hash

• get **hash**(): any

*Defined in [src/signed-message.ts:35](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L35)*

Purpose: returns a hash of this object's properties

**Returns:** any

___

### id

• get **id**(): any

*Defined in [src/signed-message.ts:58](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L58)*

Purpose: returns a string of the hash of this object's properties

**Returns:** any

___

### payloadObj

• get **payloadObj**(): any

*Defined in [src/signed-message.ts:67](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L67)*

Purpose: returns a JSON.parse of this object's payload property

**Returns:** any

## Methods

### sign

▸ **sign**(`keyPair`: KeyPair): void

*Defined in [src/signed-message.ts:77](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L77)*

Purpose: given a collection of a private key and a public key (BSV KeyPair object), sets the sig property of this object
by transforming it through an ECDSA signature method

#### Parameters:

Name | Type |
------ | ------ |
`keyPair` | KeyPair |

**Returns:** void

___

### verify

▸ **verify**(): Promise\<any>

*Defined in [src/signed-message.ts:86](https://github.com/kronoverse-inc/krono-lib/blob/9a1373d/src/signed-message.ts#L86)*

Purpose: verifies the signature held by this object

**Returns:** Promise\<any>
