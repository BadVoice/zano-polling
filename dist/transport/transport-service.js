"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportService = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
const rpc_service_helper_1 = require("./helpers/rpc/rpc.service.helper");
const types_1 = require("./types");
class TransportService {
    constructor(baseUrl, config, opts) {
        this.baseUrl = baseUrl;
        this.opts = opts;
        this.url = baseUrl;
        this.headers = opts?.headers || {};
        this.timeout = opts?.timeout || types_1.REQUEST_TIMEOUT;
        this.rpcHelper = new rpc_service_helper_1.RpcHelpersService();
        this.transportConfig = config;
    }
    async call(method, params = {}) {
        const allConfigs = this.transportConfig;
        if (!allConfigs) {
            throw new Error('Transport configuration not found!');
        }
        if (!(method in allConfigs)) {
            throw new Error(`Configuration for method ${method} not found`);
        }
        const config = allConfigs[method];
        const address = this.url;
        if (!address) {
            throw new Error(`Address for method ${method} not found in env variable (key: ${config.addressKey})`);
        }
        const url = this.generateUrl(address, config.type);
        switch (config.type) {
            case 'rpc':
                return this.makeRpcCall(url, config.rpcMethod, params, this.headers);
            case 'http':
                return this.makeHttpRequest(url, method, params, this.headers);
            default:
                throw new Error(`Unsupported transport type: ${config.type}`);
        }
    }
    async makeHttpRequest(address, method, params, header) {
        try {
            const response = await axios_1.default.request({
                url: `${address}${method}`,
                method: 'POST',
                data: params,
                headers: header,
            });
            if (response.status === 200) {
                if (response.data && typeof response.data === 'object' && 'status' in response.data && response.data.status
                    === 'BUSY') {
                    throw new Error('Server is too busy, please try again later.');
                }
                return response.data;
            }
            else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`Request failed with status ${error.response.status}`);
                }
                else {
                    throw new Error('Request failed (no response)');
                }
            }
            else {
                console.error('Unexpected error:', error);
                throw new Error('HTTP request failed (unexpected error)');
            }
        }
    }
    async makeRpcCall(address, method, params, headers) {
        try {
            return await this.rpcHelper.call(address, method, params, headers);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMessage = `Axios error during RPC call to ${method} at ${address}: ${error.message}`;
                if (error.response) {
                    console.error(errorMessage, {
                        status: error.response.status,
                        data: error.response.data,
                    });
                    if (error.response.status === 404) {
                        throw new Error(`Request failed with status code 404 for method: ${method} at address ${address}`);
                    }
                }
                else if (error.request) {
                    console.error(`${errorMessage} (No response received)`, { request: error.request });
                }
                else {
                    console.error(`${errorMessage} (Error creating request)`, { error: error.config });
                }
            }
            else {
                console.error(`Unknown error during RPC call to ${method}:`, error);
            }
            throw error.message;
        }
    }
    generateUrl(address, type) {
        const url = new URL(address);
        switch (type) {
            case 'rpc':
                url.pathname = constants_1.URL_RPC_PREFIX;
                break;
            case 'http':
                url.pathname = url.pathname.replace(/\/$/, '');
                break;
            default:
                throw new Error(`Unsupported transport type: ${type}`);
        }
        return url.toString();
    }
}
exports.TransportService = TransportService;
//# sourceMappingURL=transport-service.js.map