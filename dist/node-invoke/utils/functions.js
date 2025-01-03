"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.satoshiToZano = exports.timestampMsToDate = void 0;
const big_js_1 = __importDefault(require("big.js"));
function timestampMsToDate(timestampMs) {
    return new Date(timestampMs * 1000);
}
exports.timestampMsToDate = timestampMsToDate;
function satoshiToZano(satoshiAmount) {
    const satoshi = new big_js_1.default(satoshiAmount);
    if (satoshi.lt(0)) {
        throw new Error('The number of MISTs cannot be negative');
    }
    else if (satoshi.eq(0)) {
        return '0';
    }
    satoshi.e -= 12;
    return satoshi.toFixed();
}
exports.satoshiToZano = satoshiToZano;
//# sourceMappingURL=functions.js.map