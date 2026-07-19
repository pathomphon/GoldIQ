import type {
  CurrentBuyPrice,
  GoldSale,
  GoldSaleInput,
  GoldSaleUpdateInput,
  GoldTransaction,
  GoldTransactionInput,
} from './portfolio.types';

export const PORTFOLIO_REPOSITORY_PORT = Symbol('PORTFOLIO_REPOSITORY_PORT');

export type SaleMutationFailure =
  'PURCHASE_NOT_FOUND' | 'SALE_NOT_FOUND' | 'SALE_BEFORE_PURCHASE' | 'INSUFFICIENT_WEIGHT';

export type SaleMutationResult =
  | {
      readonly ok: true;
      readonly sale: GoldSale;
      readonly transaction: GoldTransaction;
    }
  | {
      readonly ok: false;
      readonly reason: SaleMutationFailure;
    };

export interface PortfolioRepositoryPort {
  findTransactions(): Promise<readonly GoldTransaction[]>;
  findTransaction(id: string): Promise<GoldTransaction | null>;
  createTransaction(input: GoldTransactionInput): Promise<GoldTransaction>;
  updateTransaction(id: string, input: GoldTransactionInput): Promise<GoldTransaction | null>;
  deleteTransaction(id: string): Promise<boolean>;
  findSale(id: string): Promise<GoldSale | null>;
  createSale(input: GoldSaleInput): Promise<SaleMutationResult>;
  updateSale(id: string, input: GoldSaleUpdateInput): Promise<SaleMutationResult>;
  deleteSale(id: string): Promise<boolean>;
  findCurrentBuyPrices(): Promise<readonly CurrentBuyPrice[]>;
  findLatestPriceTimestamp(): Promise<Date | null>;
}
