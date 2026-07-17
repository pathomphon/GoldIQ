import type { NormalizedGoldPriceQuote } from './gold-price.types';

export const GOLD_PRICE_PROVIDER_PORT = Symbol('GOLD_PRICE_PROVIDER_PORT');

export interface GoldPriceProviderPort {
  fetchCurrentPrices(): Promise<readonly NormalizedGoldPriceQuote[]>;
}
