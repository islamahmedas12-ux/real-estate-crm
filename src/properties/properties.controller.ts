import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertyFilterDto } from './dto/property-filter.dto.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { AssignAgentDto } from '../clients/dto/assign-agent.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { FullTextSearchDto } from './dto/full-text-search.dto.js';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List properties with filters and pagination' })
  findAll(
    @Query() filter: PropertyFilterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isAdminOrManager = user?.roles?.some((r) =>
      ['admin', 'manager'].includes(r),
    ) ?? false;
    return this.propertiesService.findAll(filter, user?.sub, isAdminOrManager);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search properties using PostgreSQL tsvector' })
  @ApiResponse({ status: 200, description: 'Search results with cursor pagination' })
  fullTextSearch(
    @Query() dto: FullTextSearchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isAdminOrManager = user?.roles?.some((r) =>
      ['admin', 'manager'].includes(r),
    ) ?? false;
    return this.propertiesService.fullTextSearch(
      dto.q,
      dto.cursor,
      dto.take,
      user?.sub,
      isAdminOrManager,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get property statistics' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    const isAdminOrManager = user?.roles?.some((r) =>
      ['admin', 'manager'].includes(r),
    ) ?? false;
    return this.propertiesService.getStats(user?.sub, isAdminOrManager);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID with images' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete a property (sets status to OFF_MARKET)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, description: 'Property soft-deleted' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.remove(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Change property status' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.propertiesService.changeStatus(id, dto.status);
  }

  @Patch(':id/assign')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign property to an agent' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.propertiesService.assignAgent(id, dto.agentId);
  }
}
