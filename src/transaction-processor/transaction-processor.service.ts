import { ITransactionProcessorService } from './types';
import { IBalanceService } from '../balance/types';
import { NodeInvokeService } from '../node-invoke/node-invoke.service';
import {
  Block,
  InputKeyImage,
  DecodedTransaction,
} from '../node-invoke/types';

export class TransactionProcessorService implements ITransactionProcessorService {
  private currentHeight: number;

  constructor(
    private height: number,
    private balanceService: IBalanceService,
    private nodeInvokeService: NodeInvokeService,
  ) {
    this.currentHeight = this.height;
  }

  async processNewBlocks(): Promise<void> {
    const newHeight: number = await this.nodeInvokeService.getHeight();
    if (newHeight > this.currentHeight) {
      await this.processBlocksInRange(this.currentHeight, newHeight);
      this.currentHeight = newHeight;
    }
  }

  private async processBlocksInRange(startHeight: number, endHeight: number): Promise<void> {
    for (let height = startHeight; height <= endHeight; height++) {
      try {
        const blockInfo: Block = await this.nodeInvokeService.getBlock(height);
        if (blockInfo?.decodedTransactions) {
          for (const transaction of blockInfo.decodedTransactions) {
            this.processTransaction(transaction, height);
          }
        }
      } catch (error) {
        console.error(`Error processing block at height ${height}:`, error.message);
      }
    }
  }

  async getCurrentHeight(): Promise<number> {
    if (this.currentHeight === undefined) {
      this.currentHeight = await this.nodeInvokeService.getHeight();
    }
    return this.currentHeight;
  }

  async rescanBlocks(startHeight: number): Promise<void> {
    const currentHeight: number = await this.nodeInvokeService.getHeight();
    const keyImageHeights: Map<string, { amount: string; height: number }> = this.balanceService.getKeyImageHeights();
    const heightsToResync: Set<number> = new Set<number>();

    for (const [, value] of keyImageHeights) {
      heightsToResync.add(value.height);
    }

    const sortedHeights = Array.from(heightsToResync).sort((a, b) => a - b);

    for (const height of sortedHeights) {
      if (height < startHeight || height > currentHeight) {
        continue;
      }

      await this.processBlock(height);
    }
  }

  async processBlock(height: number): Promise<void> {
    try {
      const blockInfo: Block = await this.nodeInvokeService.getBlock(height);

      if (blockInfo) {
        for (const transaction of blockInfo.decodedTransactions) {
          this.processTransaction(transaction, height);
        }
      }
    } catch (error) {
      console.error(`Error processing block at height ${height}:`, error);
    }
  }

  private processTransaction(transaction: DecodedTransaction, height: number): void {
    const { inputKeyImages, keyImages } = transaction;

    keyImages.forEach(({ keyImage, amount }) => {
      this.balanceService.addKeyImage(keyImage, amount, height);
    });

    if (inputKeyImages?.length) {
      inputKeyImages.forEach((input: InputKeyImage) => {
        if (input.keyImage && this.balanceService.hasKeyImage(input.keyImage)) {
          this.balanceService.removeKeyImage(input.keyImage);
        }
      });
    }

    this.balanceService.calculateBalance();
  }
}
