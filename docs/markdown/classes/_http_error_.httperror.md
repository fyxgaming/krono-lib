**[@kronoverse/lib](../README.md)**

> [Globals](../globals.md) / ["http-error"](../modules/_http_error_.md) / HttpError

# Class: HttpError

This class supports handling of HTTP errors and is also used within the krono-lib library.

## Hierarchy

* [Error](_http_error_.httperror.md#error)

  ↳ **HttpError**

## Index

### Constructors

* [constructor](_http_error_.httperror.md#constructor)

### Properties

* [message](_http_error_.httperror.md#message)
* [name](_http_error_.httperror.md#name)
* [stack](_http_error_.httperror.md#stack)
* [status](_http_error_.httperror.md#status)
* [Error](_http_error_.httperror.md#error)

## Constructors

### constructor

\+ **new HttpError**(`status`: number, ...`args`: any[]): [HttpError](_http_error_.httperror.md)

*Defined in [src/http-error.ts:11](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/http-error.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`status` | number |
`...args` | any[] |

**Returns:** [HttpError](_http_error_.httperror.md)

## Properties

### message

•  **message**: string

*Inherited from [HttpError](_http_error_.httperror.md).[message](_http_error_.httperror.md#message)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:974*

___

### name

•  **name**: string

*Inherited from [HttpError](_http_error_.httperror.md).[name](_http_error_.httperror.md#name)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:973*

___

### stack

• `Optional` **stack**: string

*Inherited from [HttpError](_http_error_.httperror.md).[stack](_http_error_.httperror.md#stack)*

*Defined in node_modules/typescript/lib/lib.es5.d.ts:975*

___

### status

•  **status**: number

*Defined in [src/http-error.ts:13](https://github.com/kronoverse-inc/krono-lib/blob/bda32c6/src/http-error.ts#L13)*

___

### Error

▪ `Static` **Error**: ErrorConstructor

*Defined in node_modules/typescript/lib/lib.es5.d.ts:984*
