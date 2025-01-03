export declare class RpcHelpersService {
    call<T, P>(address: string, method: string, params: P, header: Record<string, string>): Promise<T>;
}
