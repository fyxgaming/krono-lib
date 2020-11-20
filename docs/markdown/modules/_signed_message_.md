**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / "signed-message"

# Module: "signed-message"

## Index

### Classes

* [SignedMessage](../classes/_signed_message_.signedmessage.md)

### Variables

* [MAGIC\_BYTES](_signed_message_.md#magic_bytes)
* [MAGIC\_BYTES\_PREFIX](_signed_message_.md#magic_bytes_prefix)

## Variables

### MAGIC\_BYTES

• `Const` **MAGIC\_BYTES**: Buffer = Buffer.from('Bitcoin Signed Message:\n')

*Defined in [src/signed-message.ts:3](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L3)*

___

### MAGIC\_BYTES\_PREFIX

• `Const` **MAGIC\_BYTES\_PREFIX**: any = Bw.varIntBufNum(MAGIC\_BYTES.length)

*Defined in [src/signed-message.ts:4](https://github.com/kronoverse-inc/krono-lib/blob/95ea605/src/signed-message.ts#L4)*
