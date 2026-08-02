import type { PaginationParams, TransactionType } from '@/modules/shared/apiTypes';

export interface DriverWallet {
  id: string;
  driverId: string;
  totalEarnings: number;
  totalWithdrawals: number;
  totalDebt: number;
  availableBalance: number;
  pendingBalance: number;
  createdAt: string;
  updatedAt: string;
}

/** Every balance movement lands here — earnings, fees, withdrawals, debt. */
export interface LedgerTransaction {
  id: string;
  driverId: string;
  type: TransactionType;
  /** Negative for anything leaving the wallet. */
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

// -------------------------------------------------------------- requests

export interface ListTransactionsVariables extends PaginationParams {
  driverId: string;
}

export interface WithdrawVariables {
  driverId: string;
  /** At least MIN_WITHDRAWAL, and within the available balance. */
  amount: number;
}
