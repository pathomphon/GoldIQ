import type { GoldProductCode } from './gold-product';
import type {
  GoldPriceSnapshot,
  NormalizedGoldPriceQuote,
  SaveGoldPricesResult,
} from './gold-price.types';

export const GOLD_PRICE_REPOSITORY_PORT = Symbol('GOLD_PRICE_REPOSITORY_PORT');

export interface GoldPriceRepositoryPort {
  saveQuotes(quotes: readonly NormalizedGoldPriceQuote[]): Promise<SaveGoldPricesResult>;
  findCurrentPrices(): Promise<readonly GoldPriceSnapshot[]>;
  findHistory(
    productCode: GoldProductCode | undefined,
    limit: number,
  ): Promise<readonly GoldPriceSnapshot[]>;
}
