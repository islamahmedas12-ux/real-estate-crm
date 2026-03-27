import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service.js';
import { DateRangeDto } from './dto/date-range.dto.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ─── Admin Dashboard ───────────────────────────────────────────────

  @Get('admin/overview')
  @Roles('admin', 'manager')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @ApiOperation({ summary: 'Admin overview — totals and period stats' })
  @ApiResponse({ status: 200, description: 'Overview statistics' })
  getAdminOverview(@Query() dateRange: DateRangeDto) {
    return this.dashboardService.getAdminOverview(dateRange);
  }

  @Get('admin/revenue')
  @Roles('admin', 'manager')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120_000)
  @ApiOperation({ summary: 'Revenue over time with period comparison' })
  @ApiResponse({ status: 200, description: 'Revenue timeline and totals' })
  getAdminRevenue(@Query() dateRange: DateRangeDto) {
    return this.dashboardService.getAdminRevenue(dateRange);
  }

  @Get('admin/leads')
  @Roles('admin', 'manager')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @ApiOperation({ summary: 'Lead pipeline summary' })
  @ApiResponse({ status: 200, description: 'Lead pipeline statistics' })
  getAdminLeads(@Query() dateRange: DateRangeDto) {
    return this.dashboardService.getAdminLeads(dateRange);
  }

  @Get('admin/properties')
  @Roles('admin', 'manager')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120_000)
  @ApiOperation({ summary: 'Properties breakdown by status and type' })
  @ApiResponse({ status: 200, description: 'Property statistics' })
  getAdminProperties() {
    return this.dashboardService.getAdminProperties();
  }

  @Get('admin/agents')
  @Roles('admin', 'manager')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @ApiOperation({ summary: 'Agent performance — leads won and revenue' })
  @ApiResponse({ status: 200, description: 'Agent performance data' })
  getAdminAgents(@Query() dateRange: DateRangeDto) {
    return this.dashboardService.getAdminAgents(dateRange);
  }

  @Get('admin/recent')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Recent activities feed' })
  @ApiResponse({ status: 200, description: 'Recent activity list' })
  getAdminRecent() {
    return this.dashboardService.getAdminRecent();
  }

  // ─── Agent Dashboard ───────────────────────────────────────────────

  @Get('agent/overview')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Agent overview — my properties, clients, leads, tasks' })
  @ApiResponse({ status: 200, description: 'Agent overview statistics' })
  getAgentOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAgentOverview(user.id);
  }

  @Get('agent/leads')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Agent lead pipeline' })
  @ApiResponse({ status: 200, description: 'Agent lead pipeline' })
  getAgentLeads(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAgentLeads(user.id);
  }

  @Get('agent/follow-ups')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Upcoming and overdue follow-ups' })
  @ApiResponse({ status: 200, description: 'Follow-up lists' })
  getAgentFollowUps(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAgentFollowUps(user.id);
  }

  @Get('agent/performance')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Agent performance — this month vs last month' })
  @ApiResponse({ status: 200, description: 'Performance comparison' })
  getAgentPerformance(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAgentPerformance(user.id);
  }
}
