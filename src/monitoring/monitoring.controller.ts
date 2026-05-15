import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator.js';
import { MonitoringService } from './monitoring.service.js';

@Controller('metrics')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  @Public()
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.monitoringService.getMetrics();
    const contentType = this.monitoringService.getContentType();
    res.set('Content-Type', contentType);
    res.send(metrics);
  }
}
