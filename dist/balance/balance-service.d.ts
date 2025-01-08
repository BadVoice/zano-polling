import { Observable } from 'rxjs';
import { IBalanceService } from './types';
export declare class BalanceService implements IBalanceService {
    private keyImagesWithHeights;
    private balanceSubject;
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
