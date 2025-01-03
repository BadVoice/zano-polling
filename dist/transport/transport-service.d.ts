import { TransportConfig, NodesOptions } from './types';
export declare class TransportService {
    protected readonly baseUrl: string;
    protected readonly opts?: NodesOptions[string];
    private readonly rpcHelper;
    protected readonly headers: Record<string, string>;
    protected url: string;
    protected timeout?: number;
    private readonly transportConfig;
    constructor(baseUrl: string, config: TransportConfig, opts?: NodesOptions[string]);
    call<T, P = any>(method: string, params?: P): Promise<T>;
    private makeHttpRequest;
    private makeRpcCall;
    private generateUrl;
}
