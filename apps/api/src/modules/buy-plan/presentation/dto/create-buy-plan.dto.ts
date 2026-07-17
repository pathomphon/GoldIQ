import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { GOLD_PRODUCT_CODES, type GoldProductCode } from '../../../gold-price/domain/gold-product';

class CreateBuyPlanLevelDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  targetPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  investmentAmount!: number;

  @IsInt()
  @Min(1)
  sequence!: number;
}

export class CreateBuyPlanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsIn(GOLD_PRODUCT_CODES)
  productCode!: GoldProductCode;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateBuyPlanLevelDto)
  levels!: CreateBuyPlanLevelDto[];
}
