import { Observable } from 'rxjs';
export declare class JobController {
    private baseUrl;
    private accountAddress;
    private secretViewKey;
    private secretSpendKey?;
    private startHeight?;
    private job;
    private isRunning;
    private readonly config;
    private readonly transportService;
    private readonly nodeInvokeService;
    private readonly keyImageService;
    private readonly transactionProcessorService;
    constructor(baseUrl: string, accountAddress: string, secretViewKey: string, secretSpendKey?: string, startHeight?: number);
    startJob(): Promise<void>;
    stopJob(): void;
    resync(startHeight: number): Promise<void>;
    getBalanceObservable(): Observable<string>;
    private handleJobError;
}
