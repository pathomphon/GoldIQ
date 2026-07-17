import type { CurrentBuyPrice, GoldTransaction, GoldTransactionInput } from './portfolio.types';

export const PORTFOLIO_REPOSITORY_PORT = Symbol('PORTFOLIO_REPOSITORY_PORT');

export interface PortfolioRepositoryPort {
  findTransactions(): Promise<readonly GoldTransaction[]>;
  findTransaction(id: string): Promise<GoldTransaction | null>;
  createTransaction(input: GoldTransactionInput): Promise<GoldTransaction>;
  updateTransaction(id: string, input: GoldTransactionInput): Promise<GoldTransaction | null>;
  deleteTransaction(id: string): Promise<boolean>;
  findCurrentBuyPrices(): Promise<readonly CurrentBuyPrice[]>;
  findLatestPriceTimestamp(): Promise<Date | null>;
}
