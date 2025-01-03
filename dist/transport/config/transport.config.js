"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createTransportConfig() {
    const config = {
        getheight: {
            type: 'http',
            addressKey: 'DAEMON_ZANO_URL_FOR_API',
        },
        get_tx_details: {
            type: 'rpc',
            addressKey: 'DAEMON_ZANO_URL_FOR_API',
            rpcMethod: 'get_tx_details',
        },
        get_blocks_details: {
            type: 'rpc',
            addressKey: 'DAEMON_ZANO_URL_FOR_API',
            rpcMethod: 'get_blocks_details',
        },
    };
    Object.defineProperty(config, 'name', {
        value: 'transport',
        writable: false,
        enumerable: true,
        configurable: false,
    });
    return config;
}
const transportConfig = createTransportConfig();
exports.default = transportConfig;
//# sourceMappingURL=transport.config.js.map