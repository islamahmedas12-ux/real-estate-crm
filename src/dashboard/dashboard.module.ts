import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 60_000, // 60 seconds default TTL for dashboard stats
      max: 50,     // max cached items
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
