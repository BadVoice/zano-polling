export class TransportService {
    protected headers: Record<string, string>;
    protected url: string;
    protected timeout?: number;

    constructor(
        protected readonly opts: NodesOptions[string],
    ) {

        this.url = opts.url;
        this.headers = opts.headers || {};
        this.timeout = opts.timeout || REQUEST_TIMEOUT;

        if (opts.query) {
            const params = Object.entries(opts.query).map(([key, value]) => `${key}=${value}`);
            this.url += `?${params.join('&')}`;
        }
    }

    private async rpcRequest<T>(
        method: string,
        params?: Record<string, unknown>,
    ): Promise<T | string> {
        try {
            const response: AxiosResponse<RpcResponse<T>> = await axios.post<RpcResponse<T>>(
                this.url + RPC_PREFIX, {
                    jsonrpc: '2.0',
                    id: new Date().toString(),
                    method,
                    params,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...this.headers,
                    },
                },
            );

            const responseData = response.data;

            if (responseData?.error?.message) {
                return `Node returned error for method ${method}: ${responseData.error.message}`;
            }

            if (!responseData?.result) {
                return `Node returned empty result for method ${method}`;
            }

            return responseData.result;
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                return axiosError.response.data;
            } else {
                return `Request error for method ${method}: ${axiosError.message}`;
            }
        }
    }
}
