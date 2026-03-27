import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class GenerateInvoicesDto {
  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Default payment method for generated invoices',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
