"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceService = void 0;
const big_js_1 = require("big.js");
const rxjs_1 = require("rxjs");
class BalanceService {
    constructor() {
        this.keyImagesWithHeights = new Map();
        this.balanceSubject = new rxjs_1.BehaviorSubject('0');
    }
    addKeyImage(keyImage, amount, height) {
        this.keyImagesWithHeights.set(keyImage, { amount, height });
    }
    removeKeyImage(keyImage) {
        this.keyImagesWithHeights.delete(keyImage);
    }
    calculateBalance() {
        let balance = new big_js_1.Big(0);
        this.keyImagesWithHeights.forEach((keyImage, key) => {
            balance = balance.plus(keyImage.amount);
        });
        this.balanceSubject.next(balance.toString());
    }
    hasKeyImage(keyImage) {
        return this.keyImagesWithHeights.has(keyImage);
    }
    getBalanceObservable() {
        return this.balanceSubject.asObservable().pipe((0, rxjs_1.distinctUntilChanged)());
    }
    getKeyImageHeights() {
        return new Map(this.keyImagesWithHeights);
    }
}
exports.BalanceService = BalanceService;
//# sourceMappingURL=balance-service.js.map