import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Cursor (last item ID) for cursor-based pagination' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  @ApiPropertyOptional({ description: 'Search query string' })
  @IsOptional()
  @IsString()
  search?: string;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function cursorPaginate<T extends { id: string }>(
  data: T[],
  take: number,
): CursorPaginatedResult<T> {
  const hasMore = data.length > take;
  const items = hasMore ? data.slice(0, take) : data;
  return {
    data: items,
    nextCursor: items.length > 0 ? items[items.length - 1].id : null,
    hasMore,
  };
}
