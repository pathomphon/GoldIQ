import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown database startup error';
      this.logger.warn({ err: message }, 'Starting without database readiness');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
