export type SuccessResponse<T> = {
    Ok: T;
};
export interface JsonRpcResponse<T> {
    jsonrpc: string;
    result: SuccessResponse<T> | ErrorResponse;
    id?: number | string | null;
    error?: Record<string, string>;
}
export type ErrorResponse = {
    Err?: Record<string, string>;
    error?: Record<string, string>;
};
export type JsonRpcRequest<T> = {
    jsonrpc: string;
    method: string;
    id: number;
    params: any;
};
