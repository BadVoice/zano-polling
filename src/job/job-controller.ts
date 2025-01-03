import { Observable } from 'rxjs';

import { JobService } from './scanner-job-service';

export class JobController {
  private job: JobService;
  private isRunning = false;

  constructor(
    private url: string,
    private accountAddress: string,
    private secretViewKey: string,
    private secretSpendKey?: string,
    private startHeight?: number,
  ) {
  }

  async startJob(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Job already started');
    }

    if (!this.job) {
      this.job = new JobService(this.url, this.accountAddress, this.secretViewKey, this.secretSpendKey, this.startHeight);
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
