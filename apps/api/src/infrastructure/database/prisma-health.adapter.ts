import { Injectable } from '@nestjs/common';

import type { DependencyHealthPort } from '../../modules/health/domain/dependency-health.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaHealthAdapter implements DependencyHealthPort {
  constructor(private readonly prisma: PrismaService) {}

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
