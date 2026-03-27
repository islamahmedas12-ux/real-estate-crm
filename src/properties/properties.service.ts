import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertyFilterDto } from './dto/property-filter.dto.js';
import { paginate, type PaginatedResult } from '../common/dto/pagination.dto.js';
import { cursorPaginate, type CursorPaginatedResult } from '../common/dto/cursor-pagination.dto.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        area: dto.area,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        floor: dto.floor,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        latitude: dto.latitude,
        longitude: dto.longitude,
        features: dto.features ?? undefined,
      },
    });
  }

  async findAll(
    filter: PropertyFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Promise<PaginatedResult<any>> {
    const where = this.buildWhereClause(filter, agentId, isAdminOrManager);

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { [filter.sortBy ?? 'createdAt']: filter.sortOrder ?? 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: { select: { leads: true, contracts: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        _count: { select: { leads: true, contracts: true } },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found`);
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.ensureExists(id);

    return this.prisma.property.update({
      where: { id },
      data: {
        ...dto,
        features: dto.features ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.property.update({
      where: { id },
      data: { status: 'OFF_MARKET' },
    });
  }

  async changeStatus(id: string, status: PropertyStatus) {
    await this.ensureExists(id);

    return this.prisma.property.update({
      where: { id },
      data: { status },
    });
  }

  async assignAgent(id: string, agentId: string) {
    await this.ensureExists(id);

    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`User with ID "${agentId}" not found`);
    }
    if (agent.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot assign an ADMIN user as an agent');
    }

    return this.prisma.property.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });
  }

  async getStats(agentId?: string, isAdminOrManager = false) {
    const where: Prisma.PropertyWhereInput =
      !isAdminOrManager && agentId ? { assignedAgentId: agentId } : {};

    const [total, byType, byStatus, byCity] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['city'],
        where,
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byType: byType.map((g) => ({ type: g.type, count: g._count })),
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
      byCity: byCity.map((g) => ({ city: g.city, count: g._count })),
    };
  }

  /**
   * Full-text search using PostgreSQL tsvector.
   * Searches across title, description, address, city, and region.
   */
  async fullTextSearch(
    query: string,
    cursor?: string,
    take = 20,
    agentId?: string,
    isAdminOrManager = false,
  ): Promise<CursorPaginatedResult<any>> {
    // Sanitize query: remove special tsquery chars
    const sanitized = query.replace(/[&|!<>():*]/g, ' ').trim();
    if (!sanitized) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    // Convert to tsquery format: split words and join with &
    const tsquery = sanitized
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(' & ');

    const agentFilter =
      !isAdminOrManager && agentId
        ? Prisma.sql`AND p."assignedAgentId" = ${agentId}`
        : Prisma.empty;

    const cursorFilter = cursor ? Prisma.sql`AND p."id" < ${cursor}` : Prisma.empty;

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
             ts_rank(
               to_tsvector('english',
                 coalesce(p."title", '') || ' ' ||
                 coalesce(p."description", '') || ' ' ||
                 coalesce(p."address", '') || ' ' ||
                 coalesce(p."city", '') || ' ' ||
                 coalesce(p."region", '')
               ),
               to_tsquery('english', ${tsquery})
             ) AS rank
      FROM properties p
      WHERE to_tsvector('english',
              coalesce(p."title", '') || ' ' ||
              coalesce(p."description", '') || ' ' ||
              coalesce(p."address", '') || ' ' ||
              coalesce(p."city", '') || ' ' ||
              coalesce(p."region", '')
            ) @@ to_tsquery('english', ${tsquery})
        ${agentFilter}
        ${cursorFilter}
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${take + 1}
    `;

    return cursorPaginate(results, take);
  }

  /**
   * Cursor-based pagination for large datasets.
   */
  async findAllCursor(
    filter: PropertyFilterDto,
    cursor?: string,
    take = 20,
    agentId?: string,
    isAdminOrManager = false,
  ): Promise<CursorPaginatedResult<any>> {
    const where = this.buildWhereClause(filter, agentId, isAdminOrManager);

    const data = await this.prisma.property.findMany({
      where,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: take + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { leads: true, contracts: true } },
      },
    });

    return cursorPaginate(data, take);
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Property with ID "${id}" not found`);
    }
  }

  private buildWhereClause(
    filter: PropertyFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.city) where.city = { contains: filter.city, mode: 'insensitive' };

    if (filter.minPrice || filter.maxPrice) {
      where.price = {};
      if (filter.minPrice) where.price.gte = filter.minPrice;
      if (filter.maxPrice) where.price.lte = filter.maxPrice;
    }

    if (filter.minArea || filter.maxArea) {
      where.area = {};
      if (filter.minArea) where.area.gte = filter.minArea;
      if (filter.maxArea) where.area.lte = filter.maxArea;
    }

    if (filter.bedrooms != null) {
      where.bedrooms = { gte: filter.bedrooms };
    }

    // Agent scoping: agents only see their own properties unless admin/manager
    if (!isAdminOrManager && agentId) {
      where.assignedAgentId = agentId;
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
        { region: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
