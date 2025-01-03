"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxStatus = exports.RPC_METHODS = exports.DaemonEndpoints = void 0;
var DaemonEndpoints;
(function (DaemonEndpoints) {
    DaemonEndpoints["GET_HEIGHT"] = "getheight";
})(DaemonEndpoints = exports.DaemonEndpoints || (exports.DaemonEndpoints = {}));
var RPC_METHODS;
(function (RPC_METHODS) {
    RPC_METHODS["GET_TRANSACTION"] = "get_tx_details";
    RPC_METHODS["GET_BLOCK"] = "get_blocks_details";
})(RPC_METHODS = exports.RPC_METHODS || (exports.RPC_METHODS = {}));
var TxStatus;
(function (TxStatus) {
    TxStatus["finished"] = "finished";
    TxStatus["failed"] = "failed";
    TxStatus["unknown"] = "unknown";
    TxStatus["updating"] = "updating";
})(TxStatus = exports.TxStatus || (exports.TxStatus = {}));
//# sourceMappingURL=types.js.map