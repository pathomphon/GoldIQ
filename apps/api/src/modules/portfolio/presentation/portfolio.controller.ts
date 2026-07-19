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
import { CreateGoldSaleService } from '../application/create-gold-sale.service';
import { DeleteGoldSaleService } from '../application/delete-gold-sale.service';
import { DeleteGoldTransactionService } from '../application/delete-gold-transaction.service';
import { GetPortfolioDashboardService } from '../application/get-portfolio-dashboard.service';
import { UpdateGoldSaleService } from '../application/update-gold-sale.service';
import { UpdateGoldTransactionService } from '../application/update-gold-transaction.service';
import type { GoldTransaction, PortfolioDashboard, PortfolioSale } from '../domain/portfolio.types';
import { CreateGoldSaleDto } from './dto/create-gold-sale.dto';
import { CreateGoldTransactionDto } from './dto/create-gold-transaction.dto';
import { UpdateGoldSaleDto } from './dto/update-gold-sale.dto';
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
    @Inject(CreateGoldSaleService)
    private readonly createSale: CreateGoldSaleService,
    @Inject(UpdateGoldSaleService)
    private readonly updateSale: UpdateGoldSaleService,
    @Inject(DeleteGoldSaleService)
    private readonly deleteSale: DeleteGoldSaleService,
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

  @Post('sales')
  createGoldSale(@Body() body: CreateGoldSaleDto): Promise<PortfolioSale> {
    return this.createSale.execute({
      purchaseTransactionId: body.purchaseTransactionId,
      soldAt: new Date(body.soldAt),
      salePrice: body.salePrice,
      goldWeight: body.goldWeight,
      fee: body.fee,
      notes: body.notes?.trim() || null,
    });
  }

  @Patch('sales/:id')
  updateGoldSale(@Param('id') id: string, @Body() body: UpdateGoldSaleDto): Promise<PortfolioSale> {
    return this.updateSale.execute(id, {
      soldAt: body.soldAt ? new Date(body.soldAt) : undefined,
      salePrice: body.salePrice,
      goldWeight: body.goldWeight,
      fee: body.fee,
      notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
    });
  }

  @Delete('sales/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGoldSale(@Param('id') id: string): Promise<void> {
    return this.deleteSale.execute(id);
  }
}
