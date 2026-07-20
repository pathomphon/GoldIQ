import { Module } from '@nestjs/common';

import { NewsIntelligenceModule } from '../news-intelligence/news-intelligence.module';
import { RecommendationService } from './application/recommendation.service';
import { RECOMMENDATION_REPOSITORY } from './domain/recommendation.repository.port';
import { PrismaRecommendationRepository } from './infrastructure/persistence/prisma-recommendation.repository';
import { RecommendationController } from './presentation/recommendation.controller';

@Module({
  imports: [NewsIntelligenceModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    PrismaRecommendationRepository,
    {
      provide: RECOMMENDATION_REPOSITORY,
      useExisting: PrismaRecommendationRepository,
    },
  ],
})
export class RecommendationModule {}
