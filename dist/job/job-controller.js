"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const scanner_job_service_1 = require("./scanner-job-service");
class JobController {
    constructor(url, accountAddress, secretViewKey, secretSpendKey, startHeight) {
        this.url = url;
        this.accountAddress = accountAddress;
        this.secretViewKey = secretViewKey;
        this.secretSpendKey = secretSpendKey;
        this.startHeight = startHeight;
        this.isRunning = false;
    }
    async startJob() {
        if (this.isRunning) {
            throw new Error('Job already started');
        }
        if (!this.job) {
            this.job = new scanner_job_service_1.JobService(this.url, this.accountAddress, this.secretViewKey, this.secretSpendKey, this.startHeight);
        }
        this.isRunning = true;
        try {
            await this.job.startJob(this);
        }
        catch (error) {
            this.isRunning = false;
            this.handleJobError(error);
            throw error;
        }
    }
    stopJob() {
        if (this.job) {
            this.job.stopJob(this);
            this.job = null;
        }
    }
    async resync(startHeight) {
        try {
            await this.job.resyncJob(startHeight, this);
        }
        catch (error) {
            this.handleJobError(error);
        }
    }
    getBalanceObservable() {
        if (!this.job) {
            throw new Error('JobService not initialized. Call startJob() first.');
        }
        return this.job.getBalanceObservable();
    }
    handleJobError(error) {
        if (error instanceof Error) {
            console.error('Job error:', error.message);
        }
        else {
            console.error('Unknown error:', error);
        }
    }
}
exports.JobController = JobController;
//# sourceMappingURL=job-controller.js.map