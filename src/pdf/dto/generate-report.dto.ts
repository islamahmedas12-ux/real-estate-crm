import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  MONTHLY_REVENUE = 'monthly_revenue',
  AGENT_PERFORMANCE = 'agent_performance',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report to generate', example: 'monthly_revenue' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Month in YYYY-MM format (defaults to current month)', example: '2026-03' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ description: 'Agent ID (required for agent_performance report)', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
