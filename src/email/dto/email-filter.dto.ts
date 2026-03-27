import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmailStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class EmailFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by email status', enum: EmailStatus })
  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @ApiPropertyOptional({ description: 'Filter by template name', example: 'lead-assignment' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ description: 'Filter by recipient email' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter from date', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
