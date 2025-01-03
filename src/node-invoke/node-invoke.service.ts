import { ZanoTransactionUtils, ZanoAddressUtils } from '@badvoice/zano-utils-js';
import { ZarcanumAddressKeys } from '@badvoice/zano-utils-js/dist/address/types';
import { TransactionObject } from '@badvoice/zano-utils-js/dist/transaction/types';
import { Big } from 'big.js';

import {
  InputKeyImage,
  DecodedTransaction,
  VinData,
  GetBlockResult,
  BlockRawResponse,
  TransactionDetails,
  RPC_METHODS,
  VoutData,
  TxStatus,
  Transaction,
  TransactionRawResponse,
  TxByHashResult,
  NetworkInfo,
  DaemonEndpoints,
  GetHeightResult,
} from './types';
import { TransportService } from '../transport/transport-service';
import { timestampMsToDate, satoshiToZano } from './utils/functions';

export class NodeInvokeService {
  private transportService: TransportService;
  private readonly accountAddress: string;
  private readonly secViewKey: string;
  private readonly secSpendKey: string | null;
  private confirmationLimit = 6;

  constructor(transportService: TransportService, accountAddress: string, secretViewKey: string, secretSpendKey?: string) {
    this.transportService = transportService;
    this.accountAddress = accountAddress;
    this.secViewKey = secretViewKey;
    this.secSpendKey = secretSpendKey;
  }

  async getHeight(): Promise<GetHeightResult> {
    try {
      const height: NetworkInfo = await this.transportService.call<NetworkInfo>(DaemonEndpoints.GET_HEIGHT);
      if (!height?.height) {
        throw new Error('height not found');
      }

      return height.height;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBlock(height: number): Promise<GetBlockResult> {
    const getBlockParams = {
      count: 1,
      height_start: height,
      ignore_transactions: false,
    };

    const [currentHeight, block] = await Promise.all([
      this.getHeight(),
      this.transportService.call<BlockRawResponse>(RPC_METHODS.GET_BLOCK, getBlockParams),
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

    const transactionReceipts: (TransactionRawResponse | null)[] = await Promise.all(
      (block.blocks?.[0]?.transactions_details
        ?? []).map(async (tx: TransactionDetails): Promise<TransactionRawResponse | null> => {
        return await this.transportService.call<TransactionRawResponse>(RPC_METHODS.GET_TRANSACTION, { tx_hash: tx.id })
          .catch((e) => {
            console.error(e);
            return null;
          });
      }));

    const validTransactionReceipts: TransactionRawResponse[] = transactionReceipts?.filter(t => t);

    const timestamp: Date = timestampMsToDate(block.blocks[0].timestamp);

    const decodedTransactions: DecodedTransaction[] = await this.aggregateValidOutputs(
      validTransactionReceipts,
      currentHeight,
    );

    return {
      height: block.blocks[0].height,
      timestamp,
      decodedTransactions,
    };
  }

  async txByHash(hash: string): Promise<DecodedTransaction | Transaction> {
    const [txRawResponse, currentHeight] = await Promise.all([
      this.transportService.call<TransactionRawResponse>(RPC_METHODS.GET_TRANSACTION, { tx_hash: hash }),
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

    const [result]: DecodedTransaction[] = await this.aggregateValidOutputs(
      [txRawResponse],
      currentHeight,
    );
    return result || this.createEmptyTxByHashResult(hash);
  }

  private async aggregateValidOutputs(txRawResponse: TransactionRawResponse[], currentHeight: number): Promise<DecodedTransaction[]> {
    const addressUtils: ZanoAddressUtils = new ZanoAddressUtils();
    const transactionUtils: ZanoTransactionUtils = new ZanoTransactionUtils();
    const addressKeys: ZarcanumAddressKeys = addressUtils.getKeysFromAddress(this.accountAddress);

    if (!addressKeys) {
      console.error('Invalid address key from integrated address');
      return [];
    }

    if (!txRawResponse) {
      console.error('Invalid txRawResponse');
      return [];
    }

    const resultTransactions: DecodedTransaction[] = [];
    for (const txResponse of txRawResponse) {
      if (!this.validateTransactionResponse(txResponse)) {
        continue;
      }

      const tx: TransactionObject = transactionUtils.parseObjectInJson(txResponse.tx_info.object_in_json);

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

      const validPubKey: string = tx.extra?.find(item => item?.pub_key && item.pub_key?.length > 0)?.pub_key || null;
      if (!validPubKey) {
        console.error('PubKey from tx not found');
        continue;
      }

      const inputKeyImages: InputKeyImage[] = tx.vin.map((vin: VinData) => ({
        keyImage: vin.txin_zc_input?.k_image ?? null,
      }));

      for (const [index, vout] of tx.vout.entries()) {
        if (!this.validateVoutData(vout)) {
          console.log('Incorrect vout entries in tx');
          continue;
        }

        const decryptedAmount: bigint = this.decodeVout(vout, validPubKey, index, addressKeys, transactionUtils);

        if (decryptedAmount) {
          const amount: string = satoshiToZano(decryptedAmount.toString());
          const keyImage: string = this.secSpendKey ? transactionUtils.generateKeyImage(
            validPubKey,
            this.secViewKey,
            addressKeys.spendPublicKey,
            index,
            this.secSpendKey,
          ) : null;

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

  private decodeVout(vout: VoutData, validPubKey: string, index: number, addressKeys: ZarcanumAddressKeys, transactionUtils: ZanoTransactionUtils): bigint | null {
    if (!vout || !vout.tx_out_zarcanum) {
      return null;
    }

    const stealthAddress: string = transactionUtils.getStealthAddress(
      validPubKey, this.secViewKey, addressKeys.spendPublicKey, index,
    );
    const concealingPoint: string = transactionUtils.getConcealingPoint(
      this.secViewKey, validPubKey, addressKeys.viewPublicKey, index,
    );
    const blindedAssetId: string = transactionUtils.getNativeBlindedAsset(this.secViewKey, validPubKey, index);

    if (
      stealthAddress !== vout.tx_out_zarcanum.stealth_address ||
      concealingPoint !== vout.tx_out_zarcanum.concealing_point ||
      blindedAssetId !== vout.tx_out_zarcanum.blinded_asset_id
    ) {
      return null;
    }

    const decryptedAmount: bigint = transactionUtils.decodeAmount(
      this.secViewKey, validPubKey, vout.tx_out_zarcanum.encrypted_amount, index,
    );

    if (!decryptedAmount || typeof decryptedAmount !== 'bigint') {
      console.error('Failed to decrypt amount');
      return null;
    }

    return decryptedAmount;
  }

  private checkTxStatus(
    txBlockNumber: number,
    currentHeight: number,
  ): TxStatus {
    let status: TxStatus = TxStatus.unknown;
    const currentHeightBig: Big = new Big(currentHeight);
    const txBlockNumberBig: Big = new Big(txBlockNumber);
    const confirmationLimitBig: Big = new Big(this.confirmationLimit);

    if (currentHeightBig.gte(0) && txBlockNumberBig.gte(0) && confirmationLimitBig.gte(0)) {
      const confirmDiff: Big = currentHeightBig.minus(txBlockNumberBig);

      if (confirmDiff.gte(confirmationLimitBig)) {
        status = TxStatus.finished;
      }
    }

    return status;
  }

  private createEmptyTxByHashResult(hash: string): TxByHashResult {
    return {
      hash,
      usedFee: '',
      from: [],
      to: [],
      status: TxStatus.unknown,
      raw: {},
    };
  }

  private validateVoutData(vout: VoutData): boolean {
    if (!vout || !vout.tx_out_zarcanum) {
      return false;
    }

    const {
      stealth_address,
      concealing_point,
      amount_commitment,
      blinded_asset_id,
      encrypted_amount,
    } = vout.tx_out_zarcanum;

    return (
      typeof stealth_address === 'string' &&
      typeof concealing_point === 'string' &&
      typeof amount_commitment === 'string' &&
      typeof blinded_asset_id === 'string' &&
      typeof encrypted_amount === 'string'
    );
  }

  private validateTransactionResponse(txRawResponse: TransactionRawResponse): boolean {
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
