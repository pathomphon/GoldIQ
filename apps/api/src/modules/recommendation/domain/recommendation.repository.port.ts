import type { RecommendationContext, RiskSettings } from './recommendation.types';

export const RECOMMENDATION_REPOSITORY = Symbol('RECOMMENDATION_REPOSITORY');

export interface RecommendationRepositoryPort {
  getSettings(): Promise<RiskSettings>;
  saveSettings(settings: RiskSettings): Promise<RiskSettings>;
  getContext(): Promise<RecommendationContext>;
}
