"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const rxjs_1 = require("rxjs");
const job_controller_1 = require("./job-controller");
class JobService {
    constructor(transactionProcessorService, keyImageService) {
        this.transactionProcessorService = transactionProcessorService;
        this.keyImageService = keyImageService;
        this.isRunning = false;
        this.pollingInterval = 5000;
        this.stop$ = new rxjs_1.Subject();
        this.resyncQueue$ = new rxjs_1.Subject();
    }
    async startJobInternal() {
        if (this.isRunning) {
            return;
        }
        this.stop$ = new rxjs_1.Subject();
        this.isRunning = true;
        (0, rxjs_1.merge)((0, rxjs_1.interval)(this.pollingInterval).pipe((0, rxjs_1.takeUntil)(this.stop$), (0, rxjs_1.exhaustMap)(async () => await this.transactionProcessorService.processNewBlocks())), (0, rxjs_1.from)(this.resyncQueue$).pipe((0, rxjs_1.concatMap)(startHeight => this.resync(startHeight)))).pipe((0, rxjs_1.takeUntil)(this.stop$), (0, rxjs_1.catchError)(error => {
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
        await this.transactionProcessorService.rescanBlocks(startHeight);
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
}
exports.JobService = JobService;
//# sourceMappingURL=scanner-job-service.js.map