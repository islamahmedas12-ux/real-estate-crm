import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class ChangeContractStatusDto {
  @ApiProperty({ enum: ContractStatus, description: 'New contract status', example: 'ACTIVE' })
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
