import { Observable } from 'rxjs';
import { JobController } from './job-controller';
export declare class JobService {
    private baseUrl;
    private accountAddress;
    private secretViewKey;
    private secretSpendKey?;
    private currentHeight;
    private isRunning;
    private pollingInterval;
    private nodeInvokeService;
    private keyImageService;
    private readonly transportService;
    private stop$;
    private resyncQueue$;
    constructor(baseUrl: string, accountAddress: string, secretViewKey: string, secretSpendKey?: string, startHeight?: number);
    private startJobInternal;
    startJob(controller: JobController): Promise<void>;
    resyncJob(startHeight: number, controller: JobController): Promise<void>;
    private resync;
    getBalanceObservable(): Observable<string>;
    private stopJobInternal;
    stopJob(controller: JobController): void;
    private processNewBlocks;
    private processTransaction;
    private processBlocksInRange;
}
