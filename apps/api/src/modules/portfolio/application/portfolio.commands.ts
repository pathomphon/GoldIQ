import type { GoldProductCode } from '../../gold-price/domain/gold-product';

export interface CreateGoldTransactionCommand {
  readonly productCode: GoldProductCode;
  readonly purchasedAt: Date;
  readonly purchasePrice: number;
  readonly investmentAmount: number;
  readonly fee: number;
  readonly notes: string | null;
}

export interface UpdateGoldTransactionCommand {
  readonly productCode?: GoldProductCode;
  readonly purchasedAt?: Date;
  readonly purchasePrice?: number;
  readonly investmentAmount?: number;
  readonly fee?: number;
  readonly notes?: string | null;
}
