import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles('admin', 'manager')
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue report with timeline' })
  getRevenue(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    @Query('type') type?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getRevenue({ range, from, to, groupBy, type, agentId });
  }

  @Get('leads/conversion')
  @ApiOperation({ summary: 'Lead conversion report by source' })
  getLeadConversion(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('agentId') agentId?: string,
    @Query('source') source?: string,
  ) {
    return this.reportsService.getLeadConversion({ range, from, to, agentId, source });
  }

  @Get('properties')
  @ApiOperation({ summary: 'Property report by type and status' })
  getProperties() {
    return this.reportsService.getProperties();
  }

  @Get('revenue/export')
  @ApiOperation({ summary: 'Export revenue report as CSV' })
  exportRevenueCsv(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.reportsService.getRevenue({ range, from, to, groupBy });
  }

  @Get('leads/export')
  @ApiOperation({ summary: 'Export lead conversion report as CSV' })
  exportLeadsCsv(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getLeadConversion({ range, from, to });
  }
}
