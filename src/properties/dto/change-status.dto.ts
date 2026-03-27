import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ description: 'New property status', enum: PropertyStatus, example: 'SOLD' })
  @IsNotEmpty()
  @IsEnum(PropertyStatus)
  status: PropertyStatus;
}
