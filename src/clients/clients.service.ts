import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { ClientFilterDto } from './dto/client-filter.dto.js';
import { paginate, type PaginatedResult } from '../common/dto/pagination.dto.js';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    await this.checkDuplicates(dto.email, dto.phone);

    return this.prisma.client.create({ data: dto });
  }

  async findAll(
    filter: ClientFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Promise<PaginatedResult<any>> {
    const where = this.buildWhereClause(filter, agentId, isAdminOrManager);

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { [filter.sortBy ?? 'createdAt']: filter.sortOrder ?? 'desc' },
        include: {
          _count: { select: { leads: true, contracts: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { leads: true, contracts: true } },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);

    if (dto.email || dto.phone) {
      await this.checkDuplicates(dto.email, dto.phone, id);
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const contractCount = await this.prisma.contract.count({
      where: { clientId: id },
    });

    if (contractCount > 0) {
      throw new BadRequestException(
        `Cannot delete client: ${contractCount} contract(s) are linked to this client. Remove or reassign contracts first.`,
      );
    }

    return this.prisma.client.delete({ where: { id } });
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

    return this.prisma.client.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });
  }

  async getHistory(id: string) {
    await this.ensureExists(id);

    const [leads, contracts] = await Promise.all([
      this.prisma.lead.findMany({
        where: { clientId: id },
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.findMany({
        where: { clientId: id },
        include: { invoices: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { leads, contracts };
  }

  async getStats(agentId?: string, isAdminOrManager = false) {
    const where: Prisma.ClientWhereInput =
      !isAdminOrManager && agentId ? { assignedAgentId: agentId } : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byType, bySource, recentCount] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.client.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
      this.prisma.client.count({
        where: { ...where, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      total,
      byType: Object.fromEntries(
        byType.map((g) => [g.type, g._count]),
      ),
      bySource: bySource.map((g) => ({ source: g.source, count: g._count })),
      recentCount,
    };
  }

  async checkDuplicatesPublic(params: {
    phone?: string;
    email?: string;
    nationalId?: string;
    excludeId?: string;
  }) {
    const conditions: Prisma.ClientWhereInput[] = [];

    if (params.phone) conditions.push({ phone: params.phone });
    if (params.email) conditions.push({ email: params.email });
    if (params.nationalId) conditions.push({ nationalId: params.nationalId });

    if (conditions.length === 0) {
      return { hasDuplicates: false, matches: [] };
    }

    const matches = await this.prisma.client.findMany({
      where: {
        OR: conditions,
        ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        nationalId: true,
      },
      take: 5,
    });

    return {
      hasDuplicates: matches.length > 0,
      matches: matches.map((m) => ({
        ...m,
        matchedOn: [
          ...(params.phone && m.phone === params.phone ? ['phone' as const] : []),
          ...(params.email && m.email === params.email ? ['email' as const] : []),
          ...(params.nationalId && m.nationalId === params.nationalId
            ? ['nationalId' as const]
            : []),
        ],
      })),
    };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }
  }

  private buildWhereClause(
    filter: ClientFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Prisma.ClientWhereInput {
    const where: Prisma.ClientWhereInput = {};

    if (filter.type) where.type = filter.type;
    if (filter.source) where.source = filter.source;
    if (filter.assignedAgentId) where.assignedAgentId = filter.assignedAgentId;

    // Agent scoping: agents only see their own clients unless admin/manager
    if (!isAdminOrManager && agentId) {
      where.assignedAgentId = agentId;
    }

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
        { nationalId: { contains: filter.search } },
      ];
    }

    return where;
  }

  private async checkDuplicates(email?: string, phone?: string, excludeId?: string) {
    const conditions: Prisma.ClientWhereInput[] = [];

    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    if (conditions.length === 0) return;

    const existing = await this.prisma.client.findFirst({
      where: {
        OR: conditions,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      if (email && existing.email === email) {
        throw new ConflictException(`A client with email "${email}" already exists`);
      }
      if (phone && existing.phone === phone) {
        throw new ConflictException(`A client with phone "${phone}" already exists`);
      }
    }
  }
}
