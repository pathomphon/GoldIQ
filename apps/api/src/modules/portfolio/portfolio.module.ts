import { Module } from '@nestjs/common';

import { CreateGoldTransactionService } from './application/create-gold-transaction.service';
import { DeleteGoldTransactionService } from './application/delete-gold-transaction.service';
import { GetPortfolioDashboardService } from './application/get-portfolio-dashboard.service';
import { UpdateGoldTransactionService } from './application/update-gold-transaction.service';
import { PORTFOLIO_REPOSITORY_PORT } from './domain/portfolio.repository.port';
import { PrismaPortfolioRepository } from './infrastructure/persistence/prisma-portfolio.repository';
import { PortfolioController } from './presentation/portfolio.controller';

@Module({
  controllers: [PortfolioController],
  providers: [
    GetPortfolioDashboardService,
    CreateGoldTransactionService,
    UpdateGoldTransactionService,
    DeleteGoldTransactionService,
    PrismaPortfolioRepository,
    {
      provide: PORTFOLIO_REPOSITORY_PORT,
      useExisting: PrismaPortfolioRepository,
    },
  ],
})
export class PortfolioModule {}
