import { TransportConfig } from '../types';

function createTransportConfig(): TransportConfig {
  const config: TransportConfig = {
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

const transportConfig: TransportConfig = createTransportConfig();

export default transportConfig;
