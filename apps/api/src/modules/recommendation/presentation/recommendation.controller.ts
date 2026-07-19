import { Body, Controller, Get, Inject, Patch } from '@nestjs/common';

import { RecommendationService } from '../application/recommendation.service';
import type { Recommendation, RiskSettings } from '../domain/recommendation.types';
import { UpdateRiskSettingsDto } from './dto/update-risk-settings.dto';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    @Inject(RecommendationService)
    private readonly service: RecommendationService,
  ) {}

  @Get('current')
  current(): Promise<Recommendation> {
    return this.service.getRecommendation();
  }

  @Get('settings')
  settings(): Promise<RiskSettings> {
    return this.service.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: UpdateRiskSettingsDto): Promise<RiskSettings> {
    return this.service.updateSettings({
      riskProfile: body.riskProfile,
      availableCash: body.availableCash,
      minimumCashReserve: body.minimumCashReserve,
      maxAllocationPercent: body.maxAllocationPercent,
      profitTargetPercent: body.profitTargetPercent,
      sellPartialPercent: body.sellPartialPercent,
      stopBuyAbovePrice: body.stopBuyAbovePrice ?? null,
    });
  }
}
