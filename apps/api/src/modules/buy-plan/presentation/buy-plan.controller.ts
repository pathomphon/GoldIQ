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

import { BuyPlanService } from '../application/buy-plan.service';
import type { BuyPlan, BuyPlanDashboard } from '../domain/buy-plan.types';
import { CreateBuyPlanDto } from './dto/create-buy-plan.dto';
import { UpdateBuyPlanLevelDto } from './dto/update-buy-plan-level.dto';

@Controller('buy-plans')
export class BuyPlanController {
  constructor(@Inject(BuyPlanService) private readonly buyPlans: BuyPlanService) {}

  @Get()
  dashboard(): Promise<BuyPlanDashboard> {
    return this.buyPlans.dashboard();
  }

  @Post()
  create(@Body() body: CreateBuyPlanDto): Promise<BuyPlan> {
    return this.buyPlans.create({
      name: body.name.trim(),
      productCode: body.productCode,
      levels: body.levels,
    });
  }

  @Patch('levels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateLevel(@Param('id') id: string, @Body() body: UpdateBuyPlanLevelDto): Promise<void> {
    return this.buyPlans.updateLevelStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.buyPlans.delete(id);
  }
}
