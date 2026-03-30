import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ActivityEntityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Activity type (e.g. CREATE, UPDATE, DELETE, STATUS_CHANGE)',
    example: 'STATUS_CHANGE',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Human-readable description of the activity',
    example: 'Property status changed to SOLD',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    enum: ActivityEntityType,
    description: 'Type of entity this activity relates to',
    example: 'PROPERTY',
  })
  @IsNotEmpty()
  @IsEnum(ActivityEntityType)
  entityType: ActivityEntityType;

  @ApiProperty({
    description: 'UUID of the related entity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty({
    description: 'UUID of the user who performed the action',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsString()
  performedBy: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (e.g. old/new values)',
    example: { oldStatus: 'AVAILABLE', newStatus: 'SOLD' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
