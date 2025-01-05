"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const rxjs_1 = require("rxjs");
const job_controller_1 = require("./job-controller");
const key_image_service_1 = require("./key-image-service");
const node_invoke_service_1 = require("../node-invoke/node-invoke.service");
const transport_config_1 = __importDefault(require("../transport/config/transport.config"));
const transport_service_1 = require("../transport/transport-service");
class JobService {
    constructor(baseUrl, accountAddress, secretViewKey, secretSpendKey, startHeight) {
        this.baseUrl = baseUrl;
        this.accountAddress = accountAddress;
        this.secretViewKey = secretViewKey;
        this.secretSpendKey = secretSpendKey;
        this.isRunning = false;
        this.pollingInterval = 5000;
        this.stop$ = new rxjs_1.Subject();
        this.resyncQueue$ = new rxjs_1.Subject();
        this.transportService = new transport_service_1.TransportService(this.baseUrl, transport_config_1.default);
        this.nodeInvokeService =
            new node_invoke_service_1.NodeInvokeService(this.transportService, this.accountAddress, this.secretViewKey, this.secretSpendKey);
        this.keyImageService = new key_image_service_1.KeyImageService();
        this.currentHeight = startHeight;
    }
    async startJobInternal() {
        if (this.isRunning) {
            return;
        }
        this.stop$ = new rxjs_1.Subject();
        this.isRunning = true;
        (0, rxjs_1.merge)((0, rxjs_1.interval)(this.pollingInterval).pipe((0, rxjs_1.exhaustMap)(async () => await this.processNewBlocks())), (0, rxjs_1.from)(this.resyncQueue$).pipe((0, rxjs_1.concatMap)(startHeight => this.resync(startHeight)))).pipe((0, rxjs_1.takeUntil)(this.stop$), (0, rxjs_1.catchError)(error => {
            console.error('Caught error:', error.message);
            return (0, rxjs_1.interval)(this.pollingInterval);
        })).subscribe({
            error: (err) => {
                console.error('Unhandled error', err);
            },
        });
    }
    async startJob(controller) {
        if (controller instanceof job_controller_1.JobController) {
            await this.startJobInternal();
        }
        else {
            throw new Error('Access denied. Only JobController can start the job.');
        }
    }
    async resyncJob(startHeight, controller) {
        if (controller instanceof job_controller_1.JobController) {
            this.resyncQueue$.next(startHeight);
        }
        else {
            throw new Error('Access denied. Only JobController can trigger resync.');
        }
    }
    async resync(startHeight) {
        const currentHeight = await this.nodeInvokeService.getHeight();
        const keyImageHeights = this.keyImageService.getKeyImageHeights();
        const heightsToResync = new Set();
        for (const [, value] of keyImageHeights) {
            heightsToResync.add(value.height);
        }
        const sortedHeights = Array.from(heightsToResync).sort((a, b) => a - b);
        for (const height of sortedHeights) {
            if (height < startHeight || height > currentHeight) {
                continue;
            }
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
        this.currentHeight = currentHeight;
    }
    getBalanceObservable() {
        return this.keyImageService.getBalanceObservable();
    }
    stopJobInternal() {
        this.isRunning = false;
        if (this.stop$) {
            this.stop$.next();
            this.stop$.complete();
        }
    }
    stopJob(controller) {
        if (controller instanceof job_controller_1.JobController) {
            this.stopJobInternal();
        }
        else {
            throw new Error('Access denied. Only JobController can stop the job.');
        }
    }
    async processNewBlocks() {
        try {
            if (!this.isRunning) {
                return;
            }
            const newHeight = await this.nodeInvokeService.getHeight();
            if (newHeight > this.currentHeight) {
                await this.processBlocksInRange(this.currentHeight, newHeight);
                this.currentHeight = newHeight;
            }
        }
        catch (error) {
            console.error('Error checking/processing blocks:', error.message);
            this.stopJobInternal();
            throw error.message;
        }
    }
    processTransaction(transaction, height) {
        const { inputKeyImages, keyImages } = transaction;
        keyImages.forEach(({ keyImage, amount }) => {
            this.keyImageService.addKeyImage(keyImage, amount, height);
        });
        if (inputKeyImages?.length) {
            inputKeyImages.forEach((input) => {
                if (input.keyImage && this.keyImageService.hasKeyImage(input.keyImage)) {
                    this.keyImageService.removeKeyImage(input.keyImage);
                }
            });
        }
        this.keyImageService.calculateBalance();
    }
    async processBlocksInRange(startHeight, endHeight) {
        for (let height = startHeight; height <= endHeight; height++) {
            if (!this.isRunning) {
                return;
            }
            const blockInfo = await this.nodeInvokeService.getBlock(height);
            if (blockInfo?.decodedTransactions) {
                for (const transaction of blockInfo.decodedTransactions) {
                    this.processTransaction(transaction, height);
                }
            }
        }
    }
}
exports.JobService = JobService;
//# sourceMappingURL=scanner-job-service.js.map