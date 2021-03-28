"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const retry_axios_1 = __importDefault(require("retry-axios"));
const http_error_1 = require("./http-error");
retry_axios_1.default.attach();
axios_1.default.interceptors.response.use((r) => r, (e) => Promise.reject(e.response ?
    new http_error_1.HttpError(e.response.status, e.response.data) :
    new Error('Request Error')));
exports.default = axios_1.default;
//# sourceMappingURL=fyx-axios.js.map