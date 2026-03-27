import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Contract ID this invoice belongs to' })
  @IsNotEmpty()
  @IsUUID()
  contractId: string;

  @ApiProperty({ description: 'Invoice amount', example: 15000.0 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment due date (ISO 8601)', example: '2026-04-01' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
