import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const TTL_HOURS = 24;

@Injectable()
export class IdempotencyService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Best-effort cleanup on startup — don't fail if it doesn't work
    try {
      const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);
      const result = await this.prisma.idempotencyKey.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });
      if (result.count > 0) {
        console.log(`[IdempotencyService] Cleaned up ${result.count} expired idempotency keys`);
      }
    } catch (err) {
      console.warn('[IdempotencyService] Failed to clean up expired idempotency keys:', err);
    }
  }
}
