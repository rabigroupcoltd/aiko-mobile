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

export interface LedgerTransaction {
  id: string;
  driverId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

export interface ListTransactionsVariables extends PaginationParams {
  driverId: string;
}

export interface WithdrawVariables {
  driverId: string;
  amount: number;
}
