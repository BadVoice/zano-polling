import { KeyImageService } from '../job/key-image-service';
import { NodeInvokeService } from '../node-invoke/node-invoke.service';
export interface ITransactionProcessorService {
    processNewBlocks(): Promise<void>;
    rescanBlocks(height: number): Promise<void>;
    getCurrentHeight(): Promise<number>;
}
export declare class TransactionProcessorService implements ITransactionProcessorService {
    private height;
    private keyImageService;
    private nodeInvokeService;
    private currentHeight;
    constructor(height: number, keyImageService: KeyImageService, nodeInvokeService: NodeInvokeService);
    processNewBlocks(): Promise<void>;
    private processBlocksInRange;
    getCurrentHeight(): Promise<number>;
    rescanBlocks(startHeight: number): Promise<void>;
    processBlock(height: number): Promise<void>;
    private processTransaction;
}
