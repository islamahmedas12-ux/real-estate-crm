import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeadActivityType } from '@prisma/client';

export class CreateLeadActivityDto {
  @ApiProperty({ description: 'Activity type', enum: LeadActivityType })
  @IsNotEmpty()
  @IsEnum(LeadActivityType)
  type: LeadActivityType;

  @ApiProperty({ description: 'Activity description', example: 'Called client to discuss property options' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
