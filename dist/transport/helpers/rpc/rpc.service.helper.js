"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcHelpersService = void 0;
const axios_1 = __importDefault(require("axios"));
class RpcHelpersService {
    async call(address, method, params, header) {
        const data = {
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params: params || {},
        };
        const response = await axios_1.default.request({
            url: address,
            method: 'POST',
            data,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                headers: header,
            },
        });
        if (!response?.data) {
            throw new Error('Error fetching from rpc helper');
        }
        if (response.data.error) {
            throw new Error(response.data.error.message);
        }
        const errorMessage = response.data.error?.message;
        if (errorMessage) {
            throw new Error(errorMessage);
        }
        return response.data.result;
    }
}
exports.RpcHelpersService = RpcHelpersService;
//# sourceMappingURL=rpc.service.helper.js.map