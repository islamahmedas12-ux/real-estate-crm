import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EmailService } from './email.service.js';
import { EmailController } from './email.controller.js';
import { EmailScheduler } from './email.scheduler.js';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          redis: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            ...(password ? { password } : {}),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailScheduler],
  exports: [EmailService],
})
export class EmailModule {}
