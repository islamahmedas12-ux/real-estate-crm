import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum DateRangePreset {
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class DateRangeDto {
  @ApiPropertyOptional({ enum: DateRangePreset, default: DateRangePreset.THIS_MONTH })
  @IsOptional()
  @IsEnum(DateRangePreset)
  range?: DateRangePreset = DateRangePreset.THIS_MONTH;

  @ApiPropertyOptional({ description: 'Custom start date (ISO 8601)', type: String })
  @IsOptional()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({ description: 'Custom end date (ISO 8601)', type: String })
  @IsOptional()
  @Type(() => Date)
  to?: Date;
}
