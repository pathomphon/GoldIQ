export const GOLD_PRODUCT_CODES = ['GOLD_BAR_965', 'GOLD_ORNAMENT_965', 'GOLD_9999'] as const;

export type GoldProductCode = (typeof GOLD_PRODUCT_CODES)[number];

export interface GoldProductDefinition {
  readonly code: GoldProductCode;
  readonly name: string;
  readonly purity: number;
  readonly sourceProductCode: string;
}

export const GOLD_PRODUCTS: Record<GoldProductCode, GoldProductDefinition> = {
  GOLD_BAR_965: {
    code: 'GOLD_BAR_965',
    name: 'ทองคำแท่ง 96.5%',
    purity: 96.5,
    sourceProductCode: 'HSH:96.50',
  },
  GOLD_ORNAMENT_965: {
    code: 'GOLD_ORNAMENT_965',
    name: 'ทองรูปพรรณ 96.5%',
    purity: 96.5,
    sourceProductCode: 'JEWEL:96.50',
  },
  GOLD_9999: {
    code: 'GOLD_9999',
    name: 'ทองคำ 99.99%',
    purity: 99.99,
    sourceProductCode: 'HSH:99.99',
  },
};
