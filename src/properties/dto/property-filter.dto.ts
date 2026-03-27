import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDecimal, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class PropertyFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by property type', enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  minPrice?: string;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  maxPrice?: string;

  @ApiPropertyOptional({ description: 'Minimum area (sqm)' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  minArea?: string;

  @ApiPropertyOptional({ description: 'Maximum area (sqm)' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  maxArea?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Minimum bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'price', 'area', 'title'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'price' | 'area' | 'title' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
