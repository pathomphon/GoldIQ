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

export interface CreateGoldSaleCommand {
  readonly purchaseTransactionId: string;
  readonly soldAt: Date;
  readonly salePrice: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
}

export interface UpdateGoldSaleCommand {
  readonly soldAt?: Date;
  readonly salePrice?: number;
  readonly goldWeight?: number;
  readonly fee?: number;
  readonly notes?: string | null;
}
