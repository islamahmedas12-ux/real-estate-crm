import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClientType, ClientSource } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class ClientFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by client type', enum: ClientType })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiPropertyOptional({ description: 'Filter by source', enum: ClientSource })
  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @ApiPropertyOptional({ description: 'Filter by assigned agent ID' })
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'firstName', 'lastName'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'firstName' | 'lastName' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
