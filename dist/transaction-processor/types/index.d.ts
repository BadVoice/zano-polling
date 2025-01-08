export interface ITransactionProcessorService {
    processNewBlocks(): Promise<void>;
    rescanBlocks(height: number): Promise<void>;
    getCurrentHeight(): Promise<number>;
}
