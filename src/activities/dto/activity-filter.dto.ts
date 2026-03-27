import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ActivityEntityType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class ActivityFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by activity type (e.g. CREATE, UPDATE, DELETE)', example: 'CREATE' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ActivityEntityType, description: 'Filter by entity type', example: 'PROPERTY' })
  @IsOptional()
  @IsEnum(ActivityEntityType)
  entityType?: ActivityEntityType;

  @ApiPropertyOptional({ description: 'Filter by entity ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter by performer ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiPropertyOptional({ description: 'Start date filter (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
