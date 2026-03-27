import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from './email.service.js';
import { SendEmailDto } from './dto/send-email.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { EmailFilterDto } from './dto/email-filter.dto.js';
import { paginate } from '../common/dto/pagination.dto.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('logs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'List email logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated email logs' })
  async getLogs(@Query() filter: EmailFilterDto) {
    const where: Prisma.EmailLogWhereInput = {};

    if (filter.status) where.status = filter.status;
    if (filter.template) where.template = filter.template;
    if (filter.to) where.to = { contains: filter.to, mode: 'insensitive' };

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
        ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  @Get('logs/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a single email log by ID' })
  @ApiParam({ name: 'id', description: 'Email log UUID' })
  @ApiResponse({ status: 200, description: 'Email log details' })
  @ApiResponse({ status: 404, description: 'Email log not found' })
  async getLog(@Param('id', ParseUUIDPipe) id: string) {
    const log = await this.prisma.emailLog.findUnique({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Email log with ID "${id}" not found`);
    }
    return log;
  }

  @Post('send')
  @Roles('admin')
  @ApiOperation({ summary: 'Send a custom email (admin only)' })
  @ApiResponse({ status: 201, description: 'Email queued for sending' })
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.emailService.sendEmail(dto.to, dto.subject, dto.template, dto.context ?? {});
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user email preferences' })
  @ApiResponse({ status: 200, description: 'Email preferences' })
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    let prefs = await this.prisma.emailPreference.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      // Create default preferences
      prefs = await this.prisma.emailPreference.create({
        data: { userId: user.id },
      });
    }

    return prefs;
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update current user email preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.prisma.emailPreference.upsert({
      where: { userId: user.id },
      update: dto,
      create: { userId: user.id, ...dto },
    });
  }

  @Post('retry/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Retry sending a failed email' })
  @ApiParam({ name: 'id', description: 'Email log UUID' })
  @ApiResponse({ status: 200, description: 'Email re-queued for retry' })
  @ApiResponse({ status: 404, description: 'Email log not found' })
  async retryEmail(@Param('id', ParseUUIDPipe) id: string) {
    return this.emailService.retryEmail(id);
  }
}
