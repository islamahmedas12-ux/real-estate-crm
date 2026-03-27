import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Property title', example: 'Luxury 3BR Apartment in Zamalek' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Property type',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsNotEmpty()
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({ description: 'Price in EGP', example: '2500000.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  price: string;

  @ApiProperty({ description: 'Area in square meters', example: '180.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  area: string;

  @ApiPropertyOptional({ description: 'Number of bedrooms', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Floor number', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiProperty({ description: 'Street address', example: '15 Abu El Feda St' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'City', example: 'Cairo' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Region / district', example: 'Zamalek' })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiPropertyOptional({ description: 'Latitude', example: '30.0561000' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,7' })
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude', example: '31.2243000' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,7' })
  longitude?: string;

  @ApiPropertyOptional({
    description: 'Features list',
    example: ['pool', 'gym', 'parking'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
