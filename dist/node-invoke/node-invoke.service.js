"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeInvokeService = void 0;
const zano_utils_js_1 = require("@badvoice/zano-utils-js");
const big_js_1 = require("big.js");
const types_1 = require("./types");
const functions_1 = require("./utils/functions");
class NodeInvokeService {
    constructor(transportService, accountAddress, secretViewKey, secretSpendKey) {
        this.confirmationLimit = 6;
        this.transportService = transportService;
        this.accountAddress = accountAddress;
        this.secViewKey = secretViewKey;
        this.secSpendKey = secretSpendKey;
    }
    async getHeight() {
        try {
            const height = await this.transportService.call(types_1.DaemonEndpoints.GET_HEIGHT);
            if (!height?.height) {
                throw new Error('height not found');
            }
            return height.height;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async getBlock(height) {
        const getBlockParams = {
            count: 1,
            height_start: height,
            ignore_transactions: false,
        };
        const [currentHeight, block] = await Promise.all([
            this.getHeight(),
            this.transportService.call(types_1.RPC_METHODS.GET_BLOCK, getBlockParams),
        ]);
        if (!block || typeof block === 'string') {
            console.warn('Incorrect block response');
            return null;
        }
        if (!block.blocks || !block.blocks[0]) {
            console.error(`No block found at height ${height}`);
            return null;
        }
        if (!currentHeight || typeof currentHeight === 'string') {
            console.warn('Incorrect height response');
            return null;
        }
        const transactionReceipts = await Promise.all((block.blocks?.[0]?.transactions_details
            ?? []).map(async (tx) => {
            return await this.transportService.call(types_1.RPC_METHODS.GET_TRANSACTION, { tx_hash: tx.id })
                .catch((e) => {
                console.error(e);
                return null;
            });
        }));
        const validTransactionReceipts = transactionReceipts?.filter(t => t);
        const timestamp = (0, functions_1.timestampMsToDate)(block.blocks[0].timestamp);
        const decodedTransactions = await this.aggregateValidOutputs(validTransactionReceipts, currentHeight);
        return {
            height: block.blocks[0].height,
            timestamp,
            decodedTransactions,
        };
    }
    async txByHash(hash) {
        const [txRawResponse, currentHeight] = await Promise.all([
            this.transportService.call(types_1.RPC_METHODS.GET_TRANSACTION, { tx_hash: hash }),
            this.getHeight(),
        ]);
        if (!txRawResponse || typeof txRawResponse === 'string') {
            console.warn('Incorrect tx response');
            return null;
        }
        if (!currentHeight) {
            console.warn('Incorrect height response');
            return null;
        }
        const [result] = await this.aggregateValidOutputs([txRawResponse], currentHeight);
        return result || this.createEmptyTxByHashResult(hash);
    }
    async aggregateValidOutputs(txRawResponse, currentHeight) {
        const addressUtils = new zano_utils_js_1.ZanoAddressUtils();
        const transactionUtils = new zano_utils_js_1.ZanoTransactionUtils();
        const addressKeys = addressUtils.getKeysFromAddress(this.accountAddress);
        if (!addressKeys) {
            console.error('Invalid address key from integrated address');
            return [];
        }
        if (!txRawResponse) {
            console.error('Invalid txRawResponse');
            return [];
        }
        const resultTransactions = [];
        for (const txResponse of txRawResponse) {
            if (!this.validateTransactionResponse(txResponse)) {
                continue;
            }
            const tx = transactionUtils.parseObjectInJson(txResponse.tx_info.object_in_json);
            if (!tx) {
                console.log('Decoded transaction object incorrect');
                continue;
            }
            if (!tx.vout || tx.vout.length === 0) {
                console.log('Invalid transaction: no vout found');
                continue;
            }
            if (!tx.vin || tx.vin.length === 0) {
                console.log('Invalid transaction: no vin found');
                continue;
            }
            const validPubKey = tx.extra?.find(item => item?.pub_key && item.pub_key?.length > 0)?.pub_key || null;
            if (!validPubKey) {
                console.error('PubKey from tx not found');
                continue;
            }
            const inputKeyImages = tx.vin.map((vin) => ({
                keyImage: vin.txin_zc_input?.k_image ?? null,
            }));
            for (const [index, vout] of tx.vout.entries()) {
                if (!this.validateVoutData(vout)) {
                    console.log('Incorrect vout entries in tx');
                    continue;
                }
                const decryptedAmount = this.decodeVout(vout, validPubKey, index, addressKeys, transactionUtils);
                if (decryptedAmount) {
                    const amount = (0, functions_1.satoshiToZano)(decryptedAmount.toString());
                    const keyImage = this.secSpendKey ? transactionUtils.generateKeyImage(validPubKey, this.secViewKey, addressKeys.spendPublicKey, index, this.secSpendKey) : null;
                    if (keyImage) {
                        resultTransactions.push({
                            txHash: txResponse?.tx_info?.id,
                            keyImages: [{ keyImage, amount }],
                            status: this.checkTxStatus(txResponse.tx_info.keeper_block, currentHeight),
                            inputKeyImages,
                        });
                    }
                }
            }
        }
        return resultTransactions;
    }
    decodeVout(vout, validPubKey, index, addressKeys, transactionUtils) {
        if (!vout || !vout.tx_out_zarcanum) {
            return null;
        }
        const stealthAddress = transactionUtils.getStealthAddress(validPubKey, this.secViewKey, addressKeys.spendPublicKey, index);
        const concealingPoint = transactionUtils.getConcealingPoint(this.secViewKey, validPubKey, addressKeys.viewPublicKey, index);
        const blindedAssetId = transactionUtils.getNativeBlindedAsset(this.secViewKey, validPubKey, index);
        if (stealthAddress !== vout.tx_out_zarcanum.stealth_address ||
            concealingPoint !== vout.tx_out_zarcanum.concealing_point ||
            blindedAssetId !== vout.tx_out_zarcanum.blinded_asset_id) {
            return null;
        }
        const decryptedAmount = transactionUtils.decodeAmount(this.secViewKey, validPubKey, vout.tx_out_zarcanum.encrypted_amount, index);
        if (!decryptedAmount || typeof decryptedAmount !== 'bigint') {
            console.error('Failed to decrypt amount');
            return null;
        }
        return decryptedAmount;
    }
    checkTxStatus(txBlockNumber, currentHeight) {
        let status = types_1.TxStatus.unknown;
        const currentHeightBig = new big_js_1.Big(currentHeight);
        const txBlockNumberBig = new big_js_1.Big(txBlockNumber);
        const confirmationLimitBig = new big_js_1.Big(this.confirmationLimit);
        if (currentHeightBig.gte(0) && txBlockNumberBig.gte(0) && confirmationLimitBig.gte(0)) {
            const confirmDiff = currentHeightBig.minus(txBlockNumberBig);
            if (confirmDiff.gte(confirmationLimitBig)) {
                status = types_1.TxStatus.finished;
            }
        }
        return status;
    }
    createEmptyTxByHashResult(hash) {
        return {
            hash,
            usedFee: '',
            from: [],
            to: [],
            status: types_1.TxStatus.unknown,
            raw: {},
        };
    }
    validateVoutData(vout) {
        if (!vout || !vout.tx_out_zarcanum) {
            return false;
        }
        const { stealth_address, concealing_point, amount_commitment, blinded_asset_id, encrypted_amount, } = vout.tx_out_zarcanum;
        return (typeof stealth_address === 'string' &&
            typeof concealing_point === 'string' &&
            typeof amount_commitment === 'string' &&
            typeof blinded_asset_id === 'string' &&
            typeof encrypted_amount === 'string');
    }
    validateTransactionResponse(txRawResponse) {
        if (!txRawResponse || !txRawResponse.tx_info) {
            console.error('Transaction response or transaction info is missing');
            return false;
        }
        if (txRawResponse.status !== 'OK') {
            console.error('Transaction status is not OK');
            return false;
        }
        const info = txRawResponse.tx_info;
        if (!info.blob || !info.id || !info.keeper_block || !info.object_in_json ||
            !info.pub_key || !info.timestamp) {
            console.error('Transaction response fields incorrect');
            return false;
        }
        if (typeof info.amount !== 'number' ||
            typeof info.blob !== 'string' ||
            typeof info.blob_size !== 'number' ||
            typeof info.id !== 'string' ||
            typeof info.keeper_block !== 'number' ||
            typeof info.object_in_json !== 'string' ||
            typeof info.pub_key !== 'string' ||
            typeof info.timestamp !== 'number') {
            return false;
        }
        return true;
    }
}
exports.NodeInvokeService = NodeInvokeService;
//# sourceMappingURL=node-invoke.service.js.map