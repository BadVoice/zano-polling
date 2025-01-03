export type GetHeightResult = number;
export declare enum DaemonEndpoints {
    GET_HEIGHT = "getheight"
}
export declare enum RPC_METHODS {
    GET_TRANSACTION = "get_tx_details",
    GET_BLOCK = "get_blocks_details"
}
export type NetworkInfo = {
    height: number;
    status: string;
};
export type Transaction = {
    hash: string;
    usedFee: string;
    from: FromParams[];
    to: ToParams[];
    status: string;
    height?: number;
    [key: string]: unknown;
};
export type FromParams = {
    address: string;
    extraId?: string;
    value: string | null;
};
export type ToParams = {
    address: string;
    extraId?: string;
    value: string;
};
export type TxByHashResult = Transaction;
export type TransactionAttachment = {
    details_vies: string;
    short_view: string;
    type: string;
};
export type TransactionInfo = {
    amount: number;
    attachments?: TransactionAttachment[];
    blob: string;
    blob_size: number;
    extra: unknown;
    fee: number;
    id: string;
    ins: unknown;
    keeper_block: number;
    object_in_json: string;
    outs: unknown;
    pub_key: string;
    timestamp: number;
};
export type TransactionRawResponse = {
    status: string;
    tx_info: TransactionInfo;
};
export declare enum TxStatus {
    'finished' = "finished",
    'failed' = "failed",
    'unknown' = "unknown",
    'updating' = "updating"
}
export type TxOutZarcanumData = {
    stealth_address: string;
    concealing_point: string;
    amount_commitment: string;
    blinded_asset_id: string;
    encrypted_amount: number;
    mix_attr: number;
};
export type VoutData = {
    tx_out_zarcanum: TxOutZarcanumData;
};
export type TransactionDetails = {
    amount: number;
    blob: string;
    blob_size: number;
    fee: number;
    id: string;
    keeper_block: number;
    object_in_json: string;
    pub_key: string;
    timestamp: number;
};
export type BlockRawResponse = {
    blocks: BlockData[];
    status: string;
};
export type BlockData = {
    actual_timestamp: number;
    already_generated_coins: string;
    base_reward: number;
    blob: string;
    block_cumulative_size: number;
    block_tself_size: number;
    cumulative_diff_adjusted: string;
    cumulative_diff_precise: string;
    difficulty: string;
    effective_fee_median: number;
    height: number;
    id: string;
    is_orphan: boolean;
    miner_text_info: string;
    object_in_json: string;
    penalty: number;
    pow_seed: string;
    prev_id: string;
    summary_reward: number;
    this_block_fee_median: number;
    timestamp: number;
    total_fee: number;
    total_txs_size: number;
    transactions_details: TransactionDetails[];
    type: number;
};
export type GetBlockResult = Block;
export type Block = {
    height: number;
    timestamp: Date;
    decodedTransactions: DecodedTransaction[];
};
export type DecodedTransaction = {
    txHash: string;
    keyImages: {
        keyImage: string;
        amount: string;
    }[] | null;
    status: TxStatus;
    inputKeyImages: InputKeyImage[];
};
export type InputKeyImage = {
    keyImage: string;
};
export type TxinZcInputData = {
    key_offsets: KeyOffsetData;
    k_image: string;
    etc_details: unknown[];
};
export type VinData = {
    txin_zc_input: TxinZcInputData;
};
export type KeyOffsetData = {
    uint64_t: number;
};
