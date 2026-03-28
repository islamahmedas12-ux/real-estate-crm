import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { LeadFilterDto } from './dto/lead-filter.dto.js';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto.js';
import { AssignAgentDto } from './dto/assign-agent.dto.js';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters and pagination' })
  findAll(@Query() filter: LeadFilterDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdminOrManager = user.roles?.some((r) => ['admin', 'manager'].includes(r)) ?? false;
    return this.leadsService.findAll(filter, user.id, isAdminOrManager);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get leads grouped by status for kanban pipeline view' })
  @ApiQuery({
    name: 'limitPerStatus',
    required: false,
    type: Number,
    description: 'Max leads per status bucket (default 50)',
  })
  getPipeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limitPerStatus') limitPerStatus?: string,
  ) {
    const isAdminOrManager = user.roles?.some((r) => ['admin', 'manager'].includes(r)) ?? false;
    const limit = limitPerStatus
      ? Math.min(Math.max(parseInt(limitPerStatus, 10) || 50, 1), 200)
      : 50;
    return this.leadsService.getPipeline(user.id, isAdminOrManager, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    const isAdminOrManager = user.roles?.some((r) => ['admin', 'manager'].includes(r)) ?? false;
    return this.leadsService.getStats(user.id, isAdminOrManager);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID with client, property, and recent activities' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead details' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete a lead by marking it as LOST (admin only)' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead marked as LOST' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change lead status (validates allowed transitions)' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead status changed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeLeadStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.changeStatus(id, dto, user.id);
  }

  @Patch(':id/assign')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign lead to an agent (admin/manager only)' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  assignAgent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignAgentDto) {
    return this.leadsService.assignAgent(id, dto.agentId);
  }

  @Post(':id/convert')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Convert a WON lead into a Client, returns created client' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 201, description: 'Client created from lead' })
  @ApiResponse({ status: 400, description: 'Lead must be in WON status to convert' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.convert(id, user.id);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add an activity to a lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeadActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leadsService.addActivity(id, dto, user.id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get paginated activities for a lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated lead activities' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  getActivities(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.leadsService.getActivities(id, page, limit);
  }
}
