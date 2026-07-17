import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';

import { HealthService } from '../application/health.service';
import type { ReadinessResult } from '../domain/health.types';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService)
    private readonly healthService: HealthService,
  ) {}

  @Get('liveness')
  liveness(): ReturnType<HealthService['liveness']> {
    return this.healthService.liveness();
  }

  @Get('readiness')
  async readiness(): Promise<ReadinessResult> {
    const readiness = await this.healthService.readiness();

    if (readiness.status === 'error') {
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }
}
