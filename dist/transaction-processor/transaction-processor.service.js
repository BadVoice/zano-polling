"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProcessorService = void 0;
class TransactionProcessorService {
    constructor(height, balanceService, nodeInvokeService) {
        this.height = height;
        this.balanceService = balanceService;
        this.nodeInvokeService = nodeInvokeService;
        this.currentHeight = this.height;
    }
    async processNewBlocks() {
        const newHeight = await this.nodeInvokeService.getHeight();
        if (newHeight > this.currentHeight) {
            await this.processBlocksInRange(this.currentHeight, newHeight);
            this.currentHeight = newHeight;
        }
    }
    async processBlocksInRange(startHeight, endHeight) {
        for (let height = startHeight; height <= endHeight; height++) {
            try {
                const blockInfo = await this.nodeInvokeService.getBlock(height);
                if (blockInfo?.decodedTransactions) {
                    for (const transaction of blockInfo.decodedTransactions) {
                        this.processTransaction(transaction, height);
                    }
                }
            }
            catch (error) {
                console.error(`Error processing block at height ${height}:`, error.message);
            }
        }
    }
    async getCurrentHeight() {
        if (this.currentHeight === undefined) {
            this.currentHeight = await this.nodeInvokeService.getHeight();
        }
        return this.currentHeight;
    }
    async rescanBlocks(startHeight) {
        const currentHeight = await this.nodeInvokeService.getHeight();
        const keyImageHeights = this.balanceService.getKeyImageHeights();
        const heightsToResync = new Set();
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
    async processBlock(height) {
        try {
            const blockInfo = await this.nodeInvokeService.getBlock(height);
            if (blockInfo) {
                for (const transaction of blockInfo.decodedTransactions) {
                    this.processTransaction(transaction, height);
                }
            }
        }
        catch (error) {
            console.error(`Error processing block at height ${height}:`, error);
        }
    }
    processTransaction(transaction, height) {
        const { inputKeyImages, keyImages } = transaction;
        keyImages.forEach(({ keyImage, amount }) => {
            this.balanceService.addKeyImage(keyImage, amount, height);
        });
        if (inputKeyImages?.length) {
            inputKeyImages.forEach((input) => {
                if (input.keyImage && this.balanceService.hasKeyImage(input.keyImage)) {
                    this.balanceService.removeKeyImage(input.keyImage);
                }
            });
        }
        this.balanceService.calculateBalance();
    }
}
exports.TransactionProcessorService = TransactionProcessorService;
//# sourceMappingURL=transaction-processor.service.js.map