"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceService = void 0;
const rxjs_1 = require("rxjs");
class BalanceService {
    constructor() {
        this.balanceUpdate$ = new rxjs_1.Subject();
    }
    setBalance(balance) {
        this.balanceUpdate$.next(balance);
    }
    getBalanceObservable() {
        return this.balanceUpdate$;
    }
}
exports.BalanceService = BalanceService;
//# sourceMappingURL=balance-service.js.map