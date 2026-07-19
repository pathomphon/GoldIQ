import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { RISK_PROFILES, type RiskProfile } from '../../domain/recommendation.types';

export class UpdateRiskSettingsDto {
  @IsIn(RISK_PROFILES)
  riskProfile!: RiskProfile;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  availableCash!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumCashReserve!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  maxAllocationPercent!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  profitTargetPercent!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  sellPartialPercent!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  stopBuyAbovePrice!: number | null;
}
