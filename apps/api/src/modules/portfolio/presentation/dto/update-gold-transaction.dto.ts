import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { GOLD_PRODUCT_CODES, type GoldProductCode } from '../../../gold-price/domain/gold-product';

export class UpdateGoldTransactionDto {
  @IsOptional()
  @IsIn(GOLD_PRODUCT_CODES)
  productCode?: GoldProductCode;

  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  purchasePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  investmentAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  notes?: string | null;
}
