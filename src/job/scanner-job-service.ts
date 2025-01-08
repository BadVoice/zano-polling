import {
  of,
  concatMap,
  merge,
  from,
  catchError,
  takeUntil,
  Subject,
  exhaustMap,
  interval,
  Observable,
} from 'rxjs';

import { JobController } from './job-controller';
import { IBalanceService } from '../balance/types';
import { ITransactionProcessorService } from '../transaction-processor/types';

export class JobService {
  private isRunning = false;
  private pollingInterval = 60000;

  private stop$: Subject<void> = new Subject<void>();
  private resyncQueue$: Subject<number> = new Subject<number>();

  constructor(
    private transactionProcessorService: ITransactionProcessorService,
    private balanceService: IBalanceService,
  ) {
  }

  private async startJobInternal(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.stop$ = new Subject<void>();
    this.isRunning = true;

    merge(
      of(null).pipe(
        exhaustMap(async () => {
          try {
            return await this.transactionProcessorService.processNewBlocks();
          } catch (initialError) {
            console.error('Error initial scanning process:', initialError.message);
            throw initialError.message;
          }
        }),
      ),
      interval(this.pollingInterval).pipe(
        takeUntil(this.stop$),
        exhaustMap(async () => {
          try {
            return await this.transactionProcessorService.processNewBlocks();
          } catch (intervalError) {
            console.error('Error scanning blocks:', intervalError);
            throw intervalError.message;
          }
        }),
      ),
      from(this.resyncQueue$).pipe(
        concatMap(startHeight => this.resync(startHeight)),
      ),
    ).pipe(
      takeUntil(this.stop$),
      catchError(error => {
        console.error('Caught error:', error.message);
        return interval(this.pollingInterval);
      }),
    ).subscribe({
      error: (err) => {
        console.error('Unhandled error', err.message);
      },
    });
  }


  public async startJob(controller: JobController): Promise<void> {
    if (controller instanceof JobController) {
      await this.startJobInternal();
    } else {
      throw new Error('Access denied. Only JobController can start the job.');
    }
  }

  public async resyncJob(startHeight: number, controller: JobController): Promise<void> {
    if (controller instanceof JobController) {
      this.resyncQueue$.next(startHeight);
    } else {
      throw new Error('Access denied. Only JobController can trigger resync.');
    }
  }

  private async resync(startHeight: number): Promise<void> {
    await this.transactionProcessorService.rescanBlocks(startHeight);
  }

  getBalanceObservable(): Observable<string> {
    return this.balanceService.getBalanceObservable();
  }

  private stopJobInternal(): void {
    this.isRunning = false;
    if (this.stop$) {
      this.stop$.next();
      this.stop$.complete();
    }
  }

  public stopJob(controller: JobController): void {
    if (controller instanceof JobController) {
      this.stopJobInternal();
    } else {
      throw new Error('Access denied. Only JobController can stop the job.');
    }
  }
}
