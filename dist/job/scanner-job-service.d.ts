import { Observable } from 'rxjs';
import { JobController } from './job-controller';
import { KeyImageService } from './key-image-service';
import { ITransactionProcessorService } from '../transaction-processor/transaction-processor.service';
export declare class JobService {
    private transactionProcessorService;
    private keyImageService;
    private isRunning;
    private pollingInterval;
    private stop$;
    private resyncQueue$;
    constructor(transactionProcessorService: ITransactionProcessorService, keyImageService: KeyImageService);
    private startJobInternal;
    startJob(controller: JobController): Promise<void>;
    resyncJob(startHeight: number, controller: JobController): Promise<void>;
    private resync;
    getBalanceObservable(): Observable<string>;
    private stopJobInternal;
    stopJob(controller: JobController): void;
}
