import { Observable } from 'rxjs';


import { JobService } from './scanner-job-service';
import { BalanceService } from '../balance/balance-service';
import { IBalanceService } from '../balance/types';
import { NodeInvokeService } from '../node-invoke/node-invoke.service';
import { TransactionProcessorService } from '../transaction-processor/transaction-processor.service'
import transportConfig from '../transport/config/transport.config';
import { TransportService } from '../transport/transport-service';
import { TransportConfig } from '../transport/types';

export class JobController {
  private job: JobService;
  private isRunning = false;
  private readonly config: TransportConfig;

  private readonly transportService: TransportService;
  private readonly nodeInvokeService: NodeInvokeService;
  private readonly balanceService: IBalanceService;
  private readonly transactionProcessorService: TransactionProcessorService;

  constructor(
    private baseUrl: string,
    private accountAddress: string,
    private secretViewKey: string,
    private secretSpendKey?: string,
    private startHeight?: number,
  ) {
    this.config = transportConfig;
    this.transportService = new TransportService(this.baseUrl, this.config);
    this.nodeInvokeService =
      new NodeInvokeService(this.transportService, this.accountAddress, this.secretViewKey, this.secretSpendKey);
    this.balanceService = new BalanceService();
    this.transactionProcessorService =
      new TransactionProcessorService(this.startHeight, this.balanceService, this.nodeInvokeService);
  }

  async startJob(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Job already started');
    }

    if (!this.job) {
      this.job = new JobService(
        this.transactionProcessorService,
        this.balanceService,
      );
    }

    this.isRunning = true;

    try {
      await this.job.startJob(this);
    } catch (error) {
      this.isRunning = false;
      this.handleJobError(error);
      throw error;
    }
  }

  stopJob(): void {
    if (this.job) {
      this.job.stopJob(this);
      this.job = null;
    }
  }

  async resync(startHeight: number): Promise<void> {
    try {
      await this.job.resyncJob(startHeight, this);
    } catch (error) {
      this.handleJobError(error);
    }
  }

  getBalanceObservable(): Observable<string> {
    if (!this.job) {
      throw new Error('JobService not initialized. Call startJob() first.');
    }
    return this.job.getBalanceObservable();
  }

  private handleJobError(error: Error): void {
    if (error instanceof Error) {
      console.error('Job error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}
