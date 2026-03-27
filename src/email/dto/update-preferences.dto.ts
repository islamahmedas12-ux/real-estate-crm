import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Receive lead assignment notifications' })
  @IsOptional()
  @IsBoolean()
  leadAssignment?: boolean;

  @ApiPropertyOptional({ description: 'Receive follow-up reminder notifications' })
  @IsOptional()
  @IsBoolean()
  followUpReminder?: boolean;

  @ApiPropertyOptional({ description: 'Receive contract update notifications' })
  @IsOptional()
  @IsBoolean()
  contractUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Receive invoice reminder notifications' })
  @IsOptional()
  @IsBoolean()
  invoiceReminder?: boolean;

  @ApiPropertyOptional({ description: 'Receive payment confirmation notifications' })
  @IsOptional()
  @IsBoolean()
  paymentConfirmation?: boolean;

  @ApiPropertyOptional({ description: 'Receive weekly summary notifications' })
  @IsOptional()
  @IsBoolean()
  weeklySummary?: boolean;
}
