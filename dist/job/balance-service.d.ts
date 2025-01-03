import { Subject, Observable } from 'rxjs';
export declare class BalanceService {
    balanceUpdate$: Subject<number>;
    constructor();
    setBalance(balance: number): void;
    getBalanceObservable(): Observable<number>;
}
