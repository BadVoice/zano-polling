import { Big } from 'big.js';
import {
  distinctUntilChanged,
  Observable,
  BehaviorSubject,
} from 'rxjs';

import { IBalanceService } from './types';
import { KeyImageInfo } from '../job/types';


export class BalanceService implements IBalanceService {
  private keyImagesWithHeights: Map<string, KeyImageInfo> = new Map();
  private balanceSubject: BehaviorSubject<string> = new BehaviorSubject<string>('0');

  addKeyImage(keyImage: string, amount: string, height: number): void {
    this.keyImagesWithHeights.set(keyImage, { amount, height });
  }

  removeKeyImage(keyImage: string): void {
    this.keyImagesWithHeights.delete(keyImage);
  }

  calculateBalance(): void {
    let balance: Big = new Big(0);
    this.keyImagesWithHeights.forEach((keyImage: KeyImageInfo, key: string) => {
      balance = balance.plus(keyImage.amount);
    });

    this.balanceSubject.next(balance.toString());
  }

  hasKeyImage(keyImage: string): boolean {
    return this.keyImagesWithHeights.has(keyImage);
  }

  getBalanceObservable(): Observable<string> {
    return this.balanceSubject.asObservable().pipe(distinctUntilChanged());
  }

  getKeyImageHeights(): Map<string, { amount: string; height: number }> {
    return new Map(this.keyImagesWithHeights);
  }
}
