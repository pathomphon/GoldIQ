import type { GoldProductCode } from './gold-product';

export interface NormalizedGoldPriceQuote {
  readonly productCode: GoldProductCode;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly buyChange: number | null;
  readonly sellChange: number | null;
  readonly source: 'HUA_SENG_HENG';
  readonly sourceUpdatedAt: Date;
  readonly fetchedAt: Date;
  readonly rawResponseHash: string;
}

export interface GoldPriceSnapshot extends NormalizedGoldPriceQuote {
  readonly id: string;
  readonly productName: string;
  readonly purity: number;
}

export interface SaveGoldPricesResult {
  readonly received: number;
  readonly inserted: number;
  readonly duplicates: number;
}

export type CandleResolution = 'M1' | 'M5' | 'M15' | 'H1' | 'D1';

export type ChartTimeframe = 'INTRADAY' | '7D' | '30D' | '3M' | '1Y' | 'ALL';

export interface GoldPriceCandleSnapshot {
  readonly id: string;
  readonly productCode: GoldProductCode;
  readonly resolution: CandleResolution;
  readonly bucketStart: Date;
  readonly openBuy: number;
  readonly highBuy: number;
  readonly lowBuy: number;
  readonly closeBuy: number;
  readonly openSell: number;
  readonly highSell: number;
  readonly lowSell: number;
  readonly closeSell: number;
  readonly ticksCount: number;
}

export interface FindCandlesQueryOptions {
  readonly productCode: GoldProductCode;
  readonly resolution: CandleResolution;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}
