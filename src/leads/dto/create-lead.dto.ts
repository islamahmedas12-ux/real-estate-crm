import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadStatus, LeadPriority } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ description: 'Client UUID', example: '00000000-0000-0000-0000-000000000001' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: 'Property UUID', example: '00000000-0000-0000-0000-000000000002' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Lead status', enum: LeadStatus, default: LeadStatus.NEW })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus = LeadStatus.NEW;

  @ApiPropertyOptional({ description: 'Lead priority', enum: LeadPriority, default: LeadPriority.MEDIUM })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority = LeadPriority.MEDIUM;

  @ApiPropertyOptional({ description: 'Lead source', example: 'Website' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Budget amount', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budget?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Assigned agent UUID' })
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @ApiPropertyOptional({ description: 'Next follow-up date', example: '2026-04-01T10:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextFollowUp?: Date;
}
