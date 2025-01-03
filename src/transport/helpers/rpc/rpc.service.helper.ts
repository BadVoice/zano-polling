import axios, { AxiosResponse } from 'axios';

import { JsonRpcResponse, JsonRpcRequest } from '../helpers.wallet.types';

export class RpcHelpersService {

  async call<T, P>(
    address: string,
    method: string,
    params: P,
    header: Record<string, string>,
  ): Promise<T> {
    const data: JsonRpcRequest<P> = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params: params || {},
    };

    const response: AxiosResponse<JsonRpcResponse<T>> = await axios.request({
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

    return response.data.result as T;
  }
}
