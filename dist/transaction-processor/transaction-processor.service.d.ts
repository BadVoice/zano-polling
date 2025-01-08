import { ITransactionProcessorService } from './types';
import { IBalanceService } from '../balance/types';
import { NodeInvokeService } from '../node-invoke/node-invoke.service';
export declare class TransactionProcessorService implements ITransactionProcessorService {
    private height;
    private balanceService;
    private nodeInvokeService;
    private currentHeight;
    constructor(height: number, balanceService: IBalanceService, nodeInvokeService: NodeInvokeService);
    processNewBlocks(): Promise<void>;
    private processBlocksInRange;
    getCurrentHeight(): Promise<number>;
    rescanBlocks(startHeight: number): Promise<void>;
    processBlock(height: number): Promise<void>;
    private processTransaction;
}
