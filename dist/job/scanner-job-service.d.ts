import { Observable } from 'rxjs';
import { JobController } from './job-controller';
import { IBalanceService } from '../balance/types';
import { ITransactionProcessorService } from '../transaction-processor/types';
export declare class JobService {
    private transactionProcessorService;
    private balanceService;
    private isRunning;
    private pollingInterval;
    private stop$;
    private resyncQueue$;
    constructor(transactionProcessorService: ITransactionProcessorService, balanceService: IBalanceService);
    private startJobInternal;
    startJob(controller: JobController): Promise<void>;
    resyncJob(startHeight: number, controller: JobController): Promise<void>;
    private resync;
    getBalanceObservable(): Observable<string>;
    private stopJobInternal;
    stopJob(controller: JobController): void;
}
