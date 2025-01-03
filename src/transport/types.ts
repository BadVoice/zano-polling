export type NodesOptions = {
  [name: string]: {
    headers?: {
      [key: string]: string;
    };
    basic?: {
      user: string;
      pass: string;
    };
    query?: {
      [key: string]: string;
    };
    data?: {
      [key: string]: string;
    };
    timeout?: number;
    confirmationLimit?: number;
    [p: string]: unknown;
  };
};
export const REQUEST_TIMEOUT = 60 * 1000;
export type TransportMethodConfig = {
  type: 'rpc' | 'http';
  rpcMethod?: string;
  addressKey: string;
};
export type TransportConfig = {
  [method: string]: TransportMethodConfig;
};

export type UserConfig = {
  userKey: string;
  passKey: string;
};
