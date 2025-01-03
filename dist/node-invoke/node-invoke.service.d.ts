import { DecodedTransaction, GetBlockResult, Transaction, GetHeightResult } from './types';
import { TransportService } from '../transport/transport-service';
export declare class NodeInvokeService {
    private transportService;
    private readonly accountAddress;
    private readonly secViewKey;
    private readonly secSpendKey;
    private confirmationLimit;
    constructor(transportService: TransportService, accountAddress: string, secretViewKey: string, secretSpendKey?: string);
    getHeight(): Promise<GetHeightResult>;
    getBlock(height: number): Promise<GetBlockResult>;
    txByHash(hash: string): Promise<DecodedTransaction | Transaction>;
    private aggregateValidOutputs;
    private decodeVout;
    private checkTxStatus;
    private createEmptyTxByHashResult;
    private validateVoutData;
    private validateTransactionResponse;
}
