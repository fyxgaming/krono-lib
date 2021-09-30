"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// import * as rax from 'retry-axios';
const http_errors_1 = __importDefault(require("http-errors"));
// rax.attach();
axios_1.default.interceptors.response.use((r) => r, (e) => {
    if (e.response)
        throw (0, http_errors_1.default)(e.response.status, `${e.config.url} -  ${JSON.stringify(e.response.data)}`);
    throw e;
});
exports.default = axios_1.default;
//# sourceMappingURL=fyx-axios.js.map