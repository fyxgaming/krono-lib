export class HttpError extends Error {
    constructor(status, ...args) {
        super(...args);
        this.status = status;
    }
}
//# sourceMappingURL=http-error.js.map