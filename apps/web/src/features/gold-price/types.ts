export const goldProductCodes = ['GOLD_BAR_965', 'GOLD_ORNAMENT_965', 'GOLD_9999'] as const;

export type GoldProductCode = (typeof goldProductCodes)[number];

export interface GoldPriceSnapshot {
  readonly id: string;
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly purity: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly buyChange: number | null;
  readonly sellChange: number | null;
  readonly source: 'HUA_SENG_HENG';
  readonly sourceUpdatedAt: string;
  readonly fetchedAt: string;
  readonly rawResponseHash: string;
}

export interface CurrentGoldPrices {
  readonly data: readonly GoldPriceSnapshot[];
  readonly error: string | null;
}
