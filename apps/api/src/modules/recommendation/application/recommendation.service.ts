import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import { GetLatestMarketBriefService } from '../../news-intelligence/application/get-latest-market-brief.service';
import { applyMarketBriefShadow } from '../domain/market-brief-shadow';
import { buildRecommendation } from '../domain/recommendation.engine';
import {
  RECOMMENDATION_REPOSITORY,
  type RecommendationRepositoryPort,
} from '../domain/recommendation.repository.port';
import type { Recommendation, RiskSettings } from '../domain/recommendation.types';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: RecommendationRepositoryPort,
    @Inject(GetLatestMarketBriefService)
    private readonly getLatestMarketBrief: GetLatestMarketBriefService,
    @Inject(ConfigService)
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  async getRecommendation(): Promise<Recommendation> {
    const shadowEnabled = this.config.get('recommendation.shadowModeEnabled', { infer: true });
    const mode = this.config.get('recommendation.mode', { infer: true });
    const [market, settings, brief] = await Promise.all([
      this.repository.getContext(),
      this.repository.getSettings(),
      shadowEnabled ? this.getLatestMarketBrief.execute() : Promise.resolve(null),
    ]);
    return applyMarketBriefShadow(buildRecommendation(market, settings), brief, {
      enabled: shadowEnabled,
      mode,
      minimumConfidence: this.config.get('recommendation.shadowMinConfidence', { infer: true }),
    });
  }

  getSettings(): Promise<RiskSettings> {
    return this.repository.getSettings();
  }

  updateSettings(settings: RiskSettings): Promise<RiskSettings> {
    if (settings.minimumCashReserve > settings.availableCash) {
      throw new BadRequestException('Minimum cash reserve cannot exceed available cash');
    }
    return this.repository.saveSettings(settings);
  }
}
