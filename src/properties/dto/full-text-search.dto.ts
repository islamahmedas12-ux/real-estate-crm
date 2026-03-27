import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class FullTextSearchDto {
  @ApiProperty({ description: 'Search query', example: 'villa cairo' })
  @IsNotEmpty()
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Cursor for pagination (last item ID)' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;
}
