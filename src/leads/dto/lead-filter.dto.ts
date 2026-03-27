import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { LeadStatus, LeadPriority } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class LeadFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by lead status', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned agent ID' })
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @ApiPropertyOptional({ description: 'Filter from date', example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter to date', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'priority', 'nextFollowUp'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'priority' | 'nextFollowUp' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
