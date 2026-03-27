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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { ClientFilterDto } from './dto/client-filter.dto.js';
import { AssignAgentDto } from './dto/assign-agent.dto.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate email or phone' })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients with filters and pagination' })
  findAll(@Query() filter: ClientFilterDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdminOrManager = user.roles?.some((r) => ['admin', 'manager'].includes(r)) ?? false;
    return this.clientsService.findAll(filter, user.id, isAdminOrManager);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client statistics' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    const isAdminOrManager = user.roles?.some((r) => ['admin', 'manager'].includes(r)) ?? false;
    return this.clientsService.getStats(user.id, isAdminOrManager);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID with leads and contracts' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client updated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 409, description: 'Duplicate email or phone' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a client (admin only)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client deleted' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }

  @Patch(':id/assign')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign client to an agent' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  assignAgent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignAgentDto) {
    return this.clientsService.assignAgent(id, dto.agentId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get client interaction history (leads & contracts)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client interaction history' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getHistory(id);
  }
}
