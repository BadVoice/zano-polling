import axios, { AxiosResponse } from 'axios';

import { URL_RPC_PREFIX } from './constants';
import { RpcHelpersService } from './helpers/rpc/rpc.service.helper';
import {
  TransportMethodConfig,
  TransportConfig,
  REQUEST_TIMEOUT,
  NodesOptions,
} from './types';

export class TransportService {
  private readonly rpcHelper: RpcHelpersService;
  protected readonly headers: Record<string, string>;
  protected url: string;
  protected timeout?: number;
  private readonly transportConfig: TransportConfig;

  constructor(
    protected readonly baseUrl: string,
    config: TransportConfig,
    protected readonly opts?: NodesOptions[string],
  ) {
    this.url = baseUrl;
    this.headers = opts?.headers || {};
    this.timeout = opts?.timeout || REQUEST_TIMEOUT;
    this.rpcHelper = new RpcHelpersService();
    this.transportConfig = config;
  }

  async call<T, P = any>(method: string, params: P = {} as P): Promise<T> {
    const allConfigs: TransportConfig = this.transportConfig;
    if (!allConfigs) {
      throw new Error('Transport configuration not found!');
    }

    if (!(method in allConfigs)) {
      throw new Error(`Configuration for method ${method} not found`);
    }

    const config: TransportMethodConfig = allConfigs[method];

    const address: string = this.url;

    if (!address) {
      throw new Error(
        `Address for method ${method} not found in env variable (key: ${config.addressKey})`,
      );
    }

    const url: string = this.generateUrl(address, config.type);

    switch (config.type) {
      case 'rpc':
        return this.makeRpcCall<T, P>(url, config.rpcMethod, params, this.headers);
      case 'http':
        return this.makeHttpRequest<T, P>(url, method, params, this.headers);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  private async makeHttpRequest<T, P>(
    address: string,
    method: string,
    params: P,
    header: Record<string, string>,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.request<T>({
        url: `${address}${method}`,
        method: 'POST',
        data: params,
        headers: header,
      });

      if (response.status === 200) {
        if (response.data && typeof response.data === 'object' && 'status' in response.data && response.data.status
          === 'BUSY') {
          throw new Error(
            'Server is too busy, please try again later.',
          );
        }
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Request failed with status ${error.response.status}`);
        } else {
          throw new Error('Request failed (no response)');
        }
      } else {
        console.error('Unexpected error:', error);
        throw new Error('HTTP request failed (unexpected error)');
      }
    }
  }

  private async makeRpcCall<T, P>(
    address: string,
    method: string,
    params: P,
    headers: Record<string, string>,
  ): Promise<T> {
    try {
      return await this.rpcHelper.call<T, P>(address, method, params, headers);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = `Axios error during RPC call to ${method} at ${address}: ${error.message}`;
        if (error.response) {
          console.error(errorMessage, {
            status: error.response.status,
            data: error.response.data,
          });

          if (error.response.status === 404) {
            throw new Error(`Request failed with status code 404 for method: ${method} at address ${address}`);
          }

        } else if (error.request) {
          console.error(`${errorMessage} (No response received)`, { request: error.request });
        } else {
          console.error(`${errorMessage} (Error creating request)`, { error: error.config });
        }
      } else {
        console.error(`Unknown error during RPC call to ${method}:`, error);
      }
      throw error.message;
    }
  }

  private generateUrl(address: string, type: string): string {
    const url: URL = new URL(address);
    switch (type) {
      case 'rpc':
        url.pathname = URL_RPC_PREFIX;
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
