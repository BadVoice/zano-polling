import { Observable } from 'rxjs';
export declare class JobController {
    private url;
    private accountAddress;
    private secretViewKey;
    private secretSpendKey?;
    private startHeight?;
    private job;
    private isRunning;
    constructor(url: string, accountAddress: string, secretViewKey: string, secretSpendKey?: string, startHeight?: number);
    startJob(): Promise<void>;
    stopJob(): void;
    resync(startHeight: number): Promise<void>;
    getBalanceObservable(): Observable<string>;
    private handleJobError;
}
