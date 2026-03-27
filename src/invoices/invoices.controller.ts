import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { InvoiceFilterDto } from './dto/invoice-filter.dto.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new invoice for a contract' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of invoices' })
  findAll(@Query() filter: InvoiceFilterDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.findAll(filter, user);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get payment statistics (total due, collected, overdue)' })
  @ApiResponse({ status: 200, description: 'Invoice statistics' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.getStats(user);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'List all overdue invoices (pending past due date)' })
  @ApiResponse({ status: 200, description: 'Overdue invoices' })
  findOverdue(@CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.findOverdue(user);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'List invoices due in the next N days' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days ahead to look (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Upcoming invoices' })
  findUpcoming(@Query('days') days?: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.invoicesService.findUpcoming(days ? Number(days) : 30, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID with full contract details' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.findOne(id, user);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update an invoice (amount, due date, notes)' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  @ApiResponse({ status: 400, description: 'Cannot update paid or cancelled invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.update(id, dto, user);
  }

  @Patch(':id/pay')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a payment for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Payment recorded' })
  @ApiResponse({ status: 400, description: 'Invoice already paid or cancelled' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.recordPayment(id, dto, user);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  @ApiResponse({ status: 400, description: 'Invoice already paid or cancelled' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.cancel(id, user);
  }
}
