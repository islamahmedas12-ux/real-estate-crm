import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ClientType, ClientSource } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty({ description: 'Client first name', example: 'Ahmed' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Client last name', example: 'Hassan' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Phone number', example: '+201234567890' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone must be a valid number (10-15 digits, optional + prefix)',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'National ID number' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ description: 'Client type', enum: ClientType, example: ClientType.BUYER })
  @IsNotEmpty()
  @IsEnum(ClientType)
  type: ClientType;

  @ApiPropertyOptional({
    description: 'Lead source',
    enum: ClientSource,
    default: ClientSource.OTHER,
  })
  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
