import { Global, Module } from '@nestjs/common';

import { DATABASE_HEALTH_PORT } from '../../modules/health/domain/dependency-health.port';
import { PrismaHealthAdapter } from './prisma-health.adapter';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaHealthAdapter,
    {
      provide: DATABASE_HEALTH_PORT,
      useExisting: PrismaHealthAdapter,
    },
  ],
  exports: [PrismaService, DATABASE_HEALTH_PORT],
})
export class DatabaseModule {}
