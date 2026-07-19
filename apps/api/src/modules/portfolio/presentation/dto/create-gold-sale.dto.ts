import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateGoldSaleDto {
  @IsString()
  purchaseTransactionId!: string;

  @IsDateString()
  soldAt!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  salePrice!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  goldWeight!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee = 0;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  notes?: string | null;
}
