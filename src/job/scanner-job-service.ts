import {
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
import { KeyImageService } from './key-image-service';
import { KeyImageInfo } from './types';
import { NodeInvokeService } from '../node-invoke/node-invoke.service';
import {
  InputKeyImage,
  DecodedTransaction,
  Block,
} from '../node-invoke/types';
import transportConfig from '../transport/config/transport.config';
import { TransportService } from '../transport/transport-service';


export class JobService {
  private currentHeight: number;
  private isRunning = false;
  private pollingInterval = 5000;
  private nodeInvokeService: NodeInvokeService;
  private keyImageService: KeyImageService;
  private readonly transportService: TransportService;

  private stop$: Subject<void> = new Subject<void>();
  private resyncQueue$: Subject<number> = new Subject<number>();

  constructor(
    private baseUrl: string,
    private accountAddress: string,
    private secretViewKey: string,
    private secretSpendKey?: string,
    startHeight?: number,
  ) {
    this.transportService = new TransportService(this.baseUrl, transportConfig);
    this.nodeInvokeService =
      new NodeInvokeService(this.transportService, this.accountAddress, this.secretViewKey, this.secretSpendKey);
    this.keyImageService = new KeyImageService();
    this.currentHeight = startHeight;
  }

  private async startJobInternal(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.stop$ = new Subject<void>();
    this.isRunning = true;

    merge(
      interval(this.pollingInterval).pipe(
        exhaustMap(async () => await this.processNewBlocks()),
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
        console.error('Unhandled error', err);
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
    const currentHeight: number = await this.nodeInvokeService.getHeight();

    const keyImageHeights: Map<string, KeyImageInfo> = this.keyImageService.getKeyImageHeights();
    const heightsToResync: Set<number> = new Set<number>();

    for (const [, value] of keyImageHeights) {
      heightsToResync.add(value.height);
    }

    const sortedHeights: number[] = Array.from(heightsToResync).sort((a, b) => a - b);

    for (const height of sortedHeights) {
      if (height < startHeight || height > currentHeight) {
        continue;
      }

      try {
        const blockInfo: Block = await this.nodeInvokeService.getBlock(height);

        if (blockInfo) {
          for (const transaction of blockInfo.decodedTransactions) {
            this.processTransaction(transaction, height);
          }
        }
      } catch (error) {
        // todo: validate error
        console.error(`Error processing block at height ${height}:`, error);
      }
    }
    this.currentHeight = currentHeight;
  }

  getBalanceObservable(): Observable<string> {
    return this.keyImageService.getBalanceObservable();
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

  private async processNewBlocks(): Promise<void> {
    try {
      if (!this.isRunning) {
        return;
      }

      const newHeight: number = await this.nodeInvokeService.getHeight();
      if (newHeight > this.currentHeight) {
        await this.processBlocksInRange(this.currentHeight, newHeight);
        this.currentHeight = newHeight;
      }
    } catch (error) {
      console.error('Error checking/processing blocks:', error.message);
      this.stopJobInternal();
      throw error.message;
    }
  }

  private processTransaction(transaction: DecodedTransaction, height: number): void {
    const { inputKeyImages, keyImages } = transaction;
    // console.log(inputKeyImages);
    // console.log(keyImages, 'keyimages');

    keyImages.forEach(({ keyImage, amount }) => {
      this.keyImageService.addKeyImage(keyImage, amount, height);
    });

    if (inputKeyImages?.length) {
      inputKeyImages.forEach((input: InputKeyImage) => {
        if (input.keyImage && this.keyImageService.hasKeyImage(input.keyImage)) {
          this.keyImageService.removeKeyImage(input.keyImage);
        }
      });
    }

    this.keyImageService.calculateBalance();
  }

  private async processBlocksInRange(startHeight: number, endHeight: number): Promise<void> {
    for (let height = startHeight; height <= endHeight; height++) {
      if (!this.isRunning) {
        return;
      }

      const blockInfo: Block = await this.nodeInvokeService.getBlock(height);

      if (blockInfo?.decodedTransactions) {
        for (const transaction of blockInfo.decodedTransactions) {
          this.processTransaction(transaction, height);
        }
      }
    }
  }
}
