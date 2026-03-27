import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({ enum: ContractType, description: 'Contract type' })
  @IsEnum(ContractType)
  type: ContractType;

  @ApiProperty({ description: 'Property ID' })
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ description: 'Agent ID' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiProperty({ description: 'Contract start date (ISO 8601)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Contract end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Total contract amount', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Payment terms (JSON: installments, frequency, etc.)',
    example: { installments: 12, frequency: 'monthly' },
  })
  @IsOptional()
  @IsObject()
  paymentTerms?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
