import { Subject, Observable } from 'rxjs';

export class BalanceService {
  public balanceUpdate$: Subject<number>;

  constructor() {
    this.balanceUpdate$ = new Subject<number>();
  }

  setBalance(balance: number): void {
    this.balanceUpdate$.next(balance);
  }

  getBalanceObservable(): Observable<number> {
    return this.balanceUpdate$;
  }
}
