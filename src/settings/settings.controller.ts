import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { SettingsService } from './settings.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles('admin')
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @ApiOperation({ summary: 'Get company settings' })
  getCompany() {
    return this.settingsService.get('company');
  }

  @Put('company')
  @ApiOperation({ summary: 'Update company settings' })
  updateCompany(@Body() data: Prisma.InputJsonValue) {
    return this.settingsService.set('company', data);
  }

  @Get('property-types')
  @ApiOperation({ summary: 'Get property type config' })
  getPropertyTypes() {
    return this.settingsService.get('property-types');
  }

  @Put('property-types')
  @ApiOperation({ summary: 'Update property type config' })
  updatePropertyTypes(@Body('items') items: Prisma.InputJsonValue) {
    return this.settingsService.set('property-types', items);
  }

  @Get('lead-sources')
  @ApiOperation({ summary: 'Get lead source config' })
  getLeadSources() {
    return this.settingsService.get('lead-sources');
  }

  @Put('lead-sources')
  @ApiOperation({ summary: 'Update lead source config' })
  updateLeadSources(@Body('items') items: Prisma.InputJsonValue) {
    return this.settingsService.set('lead-sources', items);
  }
}
