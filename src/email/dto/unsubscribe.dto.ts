import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnsubscribeDto {
  @ApiPropertyOptional({ description: 'Email preference type to unsubscribe from' })
  @IsOptional()
  @IsString()
  type?: string;
}
