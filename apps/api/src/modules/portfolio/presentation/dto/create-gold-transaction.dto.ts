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

export class CreateGoldTransactionDto {
  @IsIn(GOLD_PRODUCT_CODES)
  productCode!: GoldProductCode;

  @IsDateString()
  purchasedAt!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  purchasePrice!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  investmentAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee = 0;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  notes?: string | null;
}
