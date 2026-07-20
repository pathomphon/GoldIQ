import type { GoldProductCode } from './gold-product';
import type {
  FindCandlesQueryOptions,
  GoldPriceCandleSnapshot,
  GoldPriceSnapshot,
  NormalizedGoldPriceQuote,
  SaveGoldPricesResult,
} from './gold-price.types';

export const GOLD_PRICE_REPOSITORY_PORT = Symbol('GOLD_PRICE_REPOSITORY_PORT');

export interface GoldPriceRepositoryPort {
  saveQuotes(quotes: readonly NormalizedGoldPriceQuote[]): Promise<SaveGoldPricesResult>;
  upsertCandles(quotes: readonly NormalizedGoldPriceQuote[]): Promise<void>;
  findCurrentPrices(): Promise<readonly GoldPriceSnapshot[]>;
  findHistory(
    productCode: GoldProductCode | undefined,
    limit: number,
  ): Promise<readonly GoldPriceSnapshot[]>;
  findCandles(options: FindCandlesQueryOptions): Promise<readonly GoldPriceCandleSnapshot[]>;
  purgeOldRawPrices(olderThan: Date): Promise<number>;
}
