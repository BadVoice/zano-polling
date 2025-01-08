"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const scanner_job_service_1 = require("./scanner-job-service");
const balance_service_1 = require("../balance/balance-service");
const node_invoke_service_1 = require("../node-invoke/node-invoke.service");
const transaction_processor_service_1 = require("../transaction-processor/transaction-processor.service");
const transport_config_1 = __importDefault(require("../transport/config/transport.config"));
const transport_service_1 = require("../transport/transport-service");
class JobController {
    constructor(baseUrl, accountAddress, secretViewKey, secretSpendKey, startHeight) {
        this.baseUrl = baseUrl;
        this.accountAddress = accountAddress;
        this.secretViewKey = secretViewKey;
        this.secretSpendKey = secretSpendKey;
        this.startHeight = startHeight;
        this.isRunning = false;
        this.config = transport_config_1.default;
        this.transportService = new transport_service_1.TransportService(this.baseUrl, this.config);
        this.nodeInvokeService =
            new node_invoke_service_1.NodeInvokeService(this.transportService, this.accountAddress, this.secretViewKey, this.secretSpendKey);
        this.balanceService = new balance_service_1.BalanceService();
        this.transactionProcessorService =
            new transaction_processor_service_1.TransactionProcessorService(this.startHeight, this.balanceService, this.nodeInvokeService);
    }
    async startJob() {
        if (this.isRunning) {
            throw new Error('Job already started');
        }
        if (!this.job) {
            this.job = new scanner_job_service_1.JobService(this.transactionProcessorService, this.balanceService);
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