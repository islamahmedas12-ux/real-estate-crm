import { Injectable } from '@nestjs/common';
import { Prisma, ActivityEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { ActivityFilterDto } from './dto/activity-filter.dto.js';
import { paginate, type PaginatedResult } from '../common/dto/pagination.dto.js';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a new activity. Used both by the controller and the interceptor.
   */
  async log(dto: CreateActivityDto) {
    return this.prisma.activity.create({ data: dto });
  }

  /**
   * List all activities with filters and pagination.
   */
  async findAll(filter: ActivityFilterDto): Promise<PaginatedResult<any>> {
    const where = this.buildWhereClause(filter);

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  /**
   * Get activities for a specific entity.
   */
  async findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
    filter: ActivityFilterDto,
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.ActivityWhereInput = {
      entityType,
      entityId,
      ...this.buildDateFilter(filter),
    };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  /**
   * Get activities performed by a specific user.
   */
  async findByUser(userId: string, filter: ActivityFilterDto): Promise<PaginatedResult<any>> {
    const where: Prisma.ActivityWhereInput = {
      performedBy: userId,
      ...this.buildDateFilter(filter),
    };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  /**
   * Get recent activities for dashboard feed.
   */
  async findRecent(limit = 20) {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Delete activities older than the given number of days (retention policy).
   */
  async purgeOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.prisma.activity.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return { deleted: result.count, before: cutoff.toISOString() };
  }

  private buildWhereClause(filter: ActivityFilterDto): Prisma.ActivityWhereInput {
    const where: Prisma.ActivityWhereInput = {};

    if (filter.type) where.type = filter.type;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.performedBy) where.performedBy = filter.performedBy;

    if (filter.search) {
      where.description = { contains: filter.search, mode: 'insensitive' };
    }

    Object.assign(where, this.buildDateFilter(filter));

    return where;
  }

  private buildDateFilter(filter: ActivityFilterDto): Prisma.ActivityWhereInput {
    if (!filter.from && !filter.to) return {};

    return {
      createdAt: {
        ...(filter.from ? { gte: new Date(filter.from) } : {}),
        ...(filter.to ? { lte: new Date(filter.to) } : {}),
      },
    };
  }
}
