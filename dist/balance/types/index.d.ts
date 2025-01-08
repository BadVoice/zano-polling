import { Observable } from 'rxjs';
export interface IBalanceService {
    addKeyImage(keyImage: string, amount: string, height: number): void;
    removeKeyImage(keyImage: string): void;
    calculateBalance(): void;
    hasKeyImage(keyImage: string): boolean;
    getBalanceObservable(): Observable<string>;
    getKeyImageHeights(): Map<string, {
        amount: string;
        height: number;
    }>;
}
