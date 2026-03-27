import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
