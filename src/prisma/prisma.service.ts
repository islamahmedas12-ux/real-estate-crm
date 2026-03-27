import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const poolSize = parseInt(process.env['DATABASE_POOL_SIZE'] ?? '10', 10);
    const idleTimeoutMs = parseInt(process.env['DATABASE_IDLE_TIMEOUT'] ?? '30000', 10);

    const adapter = new PrismaPg({
      connectionString: process.env['DATABASE_URL'],
      max: poolSize,
      idleTimeoutMillis: idleTimeoutMs,
    });

    super({
      adapter,
      log: process.env['NODE_ENV'] === 'production' ? ['error'] : ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection pool initialized');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection pool closed');
  }
}
