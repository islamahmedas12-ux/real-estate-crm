import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class ChangeLeadStatusDto {
  @ApiProperty({ description: 'New lead status', enum: LeadStatus, example: 'CONTACTED' })
  @IsNotEmpty()
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the status change',
    example: 'Client interested in 3-bedroom units',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
