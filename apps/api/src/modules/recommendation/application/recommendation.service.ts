import { BadRequestException, Inject, Injectable } from '@nestjs/common';

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
  ) {}

  async getRecommendation(): Promise<Recommendation> {
    const [market, settings] = await Promise.all([
      this.repository.getContext(),
      this.repository.getSettings(),
    ]);
    return buildRecommendation(market, settings);
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
