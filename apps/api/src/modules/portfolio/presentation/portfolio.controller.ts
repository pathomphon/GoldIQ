import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateGoldTransactionService } from '../application/create-gold-transaction.service';
import { DeleteGoldTransactionService } from '../application/delete-gold-transaction.service';
import { GetPortfolioDashboardService } from '../application/get-portfolio-dashboard.service';
import { UpdateGoldTransactionService } from '../application/update-gold-transaction.service';
import type { GoldTransaction, PortfolioDashboard } from '../domain/portfolio.types';
import { CreateGoldTransactionDto } from './dto/create-gold-transaction.dto';
import { UpdateGoldTransactionDto } from './dto/update-gold-transaction.dto';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    @Inject(GetPortfolioDashboardService)
    private readonly getDashboard: GetPortfolioDashboardService,
    @Inject(CreateGoldTransactionService)
    private readonly createTransaction: CreateGoldTransactionService,
    @Inject(UpdateGoldTransactionService)
    private readonly updateTransaction: UpdateGoldTransactionService,
    @Inject(DeleteGoldTransactionService)
    private readonly deleteTransaction: DeleteGoldTransactionService,
  ) {}

  @Get()
  dashboard(): Promise<PortfolioDashboard> {
    return this.getDashboard.execute();
  }

  @Post('transactions')
  create(@Body() body: CreateGoldTransactionDto): Promise<GoldTransaction> {
    return this.createTransaction.execute({
      productCode: body.productCode,
      purchasedAt: new Date(body.purchasedAt),
      purchasePrice: body.purchasePrice,
      investmentAmount: body.investmentAmount,
      fee: body.fee,
      notes: body.notes?.trim() || null,
    });
  }

  @Patch('transactions/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateGoldTransactionDto,
  ): Promise<GoldTransaction> {
    return this.updateTransaction.execute(id, {
      productCode: body.productCode,
      purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : undefined,
      purchasePrice: body.purchasePrice,
      investmentAmount: body.investmentAmount,
      fee: body.fee,
      notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
    });
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.deleteTransaction.execute(id);
  }
}
