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
