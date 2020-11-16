/**
 * Module http-error.ts supports handling of HTTP errors
 * @packageDocumentation
 */


/**
 * This class supports handling of HTTP errors and is also used within the krono-lib library.
 * 
 */
export class HttpError extends Error {

    constructor(public status: number, ...args) {
        super(...args);
    }
}