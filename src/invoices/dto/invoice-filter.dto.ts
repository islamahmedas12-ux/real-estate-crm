import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class InvoiceFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by invoice status', enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Filter by contract ID' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ description: 'Filter from due date (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to due date (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter overdue invoices only', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  overdue?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'dueDate', 'amount'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'dueDate' | 'amount' = 'dueDate';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
