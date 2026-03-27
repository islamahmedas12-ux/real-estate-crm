import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { ContractFilterDto } from './dto/filter-contract.dto.js';
import { ChangeContractStatusDto } from './dto/change-status.dto.js';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('api/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created' })
  @ApiResponse({ status: 400, description: 'Validation error or property not available' })
  @ApiResponse({ status: 404, description: 'Property or client not found' })
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List contracts with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of contracts' })
  findAll(
    @Query() filter: ContractFilterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.findAll(filter, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contract statistics' })
  @ApiResponse({ status: 200, description: 'Contract statistics' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.getStats(user);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get contracts expiring in the next N days' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days ahead (default 30)' })
  @ApiResponse({ status: 200, description: 'List of expiring contracts' })
  getExpiring(
    @Query('days') days: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.getExpiring(days ? Number(days) : 30, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID with property, client, and invoices' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.findOne(id, user);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Contract updated' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Change contract status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeContractStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.changeStatus(id, dto, user);
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'List invoices for a contract' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Contract invoices' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  findContractInvoices(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.findContractInvoices(id, user);
  }

  @Post(':id/generate-invoices')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-generate invoices from payment terms' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Invoices generated' })
  @ApiResponse({ status: 400, description: 'All invoices already generated or contract cancelled' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  generateInvoices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateInvoicesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.generateInvoices(id, dto, user);
  }
}
