import Big from 'big.js';

export function timestampMsToDate(timestampMs: number): Date {
  return new Date(timestampMs * 1000);
}

export function satoshiToZano(satoshiAmount: string): string {
  const satoshi: Big = new Big(satoshiAmount);
  if (satoshi.lt(0)) {
    throw new Error('The number of MISTs cannot be negative');
  } else if (satoshi.eq(0)) {
    return '0';
  }

  satoshi.e -= 12;
  return satoshi.toFixed();
}
