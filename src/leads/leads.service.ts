import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, LeadStatus, LeadActivityType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { LeadFilterDto } from './dto/lead-filter.dto.js';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto.js';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto.js';
import { paginate, type PaginatedResult } from '../common/dto/pagination.dto.js';

const STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.LOST],
  [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED, LeadStatus.LOST],
  [LeadStatus.QUALIFIED]: [LeadStatus.PROPOSAL, LeadStatus.LOST],
  [LeadStatus.PROPOSAL]: [LeadStatus.NEGOTIATION, LeadStatus.LOST],
  [LeadStatus.NEGOTIATION]: [LeadStatus.WON, LeadStatus.LOST],
  [LeadStatus.WON]: [],
  [LeadStatus.LOST]: [LeadStatus.NEW],
};

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto, performedBy: string) {
    // Validate client exists
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException(`Client ${dto.clientId} not found`);
    }

    // Validate property exists (optional field)
    if (dto.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
        select: { id: true },
      });
      if (!property) {
        throw new NotFoundException(`Property ${dto.propertyId} not found`);
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...dto,
        status: dto.status ?? LeadStatus.NEW,
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: LeadActivityType.STATUS_CHANGE,
        description: `Lead created with status ${lead.status}`,
        performedBy,
      },
    });

    return lead;
  }

  async findAll(
    filter: LeadFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Promise<PaginatedResult<any>> {
    const where = this.buildWhereClause(filter, agentId, isAdminOrManager);

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { [filter.sortBy ?? 'createdAt']: filter.sortOrder ?? 'desc' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          property: {
            select: { id: true, title: true, address: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        client: true,
        property: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { activities: true } },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.ensureExists(id);

    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.lead.update({
      where: { id },
      data: { status: LeadStatus.LOST },
    });
  }

  async changeStatus(id: string, dto: ChangeLeadStatusDto, performedBy: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const allowed = STATUS_TRANSITIONS[lead.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition lead from ${lead.status} to ${dto.status}. Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id },
        data: { status: dto.status },
      }),
      this.prisma.leadActivity.create({
        data: {
          leadId: id,
          type: LeadActivityType.STATUS_CHANGE,
          description: dto.notes
            ? `Status changed from ${lead.status} to ${dto.status}: ${dto.notes}`
            : `Status changed from ${lead.status} to ${dto.status}`,
          performedBy,
        },
      }),
    ]);

    return updated;
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

    return this.prisma.lead.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });
  }

  async addActivity(leadId: string, dto: CreateLeadActivityDto, performedBy: string) {
    await this.ensureExists(leadId);

    return this.prisma.leadActivity.create({
      data: {
        leadId,
        type: dto.type,
        description: dto.description,
        performedBy,
      },
    });
  }

  async getActivities(leadId: string, page = 1, limit = 20): Promise<PaginatedResult<any>> {
    await this.ensureExists(leadId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.leadActivity.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.leadActivity.count({ where: { leadId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPipeline(agentId?: string, isAdminOrManager = false, limitPerStatus = 50) {
    const baseWhere: Prisma.LeadWhereInput =
      !isAdminOrManager && agentId ? { assignedAgentId: agentId } : {};

    const statuses = Object.values(LeadStatus);
    const selectFields = {
      id: true,
      status: true,
      priority: true,
      source: true,
      budget: true,
      nextFollowUp: true,
      createdAt: true,
      client: {
        select: { id: true, firstName: true, lastName: true },
      },
      property: {
        select: { id: true, title: true },
      },
    } satisfies Prisma.LeadSelect;

    const results = await Promise.all(
      statuses.map((status) => {
        const where = { ...baseWhere, status };
        return Promise.all([
          this.prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limitPerStatus,
            select: selectFields,
          }),
          this.prisma.lead.count({ where }),
        ]);
      }),
    );

    const pipeline: Record<string, { leads: any[]; total: number }> = {};
    statuses.forEach((status, i) => {
      const [leads, total] = results[i];
      pipeline[status] = { leads, total };
    });

    return pipeline;
  }

  async getStats(agentId?: string, isAdminOrManager = false) {
    const where: Prisma.LeadWhereInput =
      !isAdminOrManager && agentId ? { assignedAgentId: agentId } : {};

    const [total, byStatus, byPriority, bySource] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
      byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
      bySource: bySource.map((g) => ({ source: g.source, count: g._count })),
    };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }
  }

  private buildWhereClause(
    filter: LeadFilterDto,
    agentId?: string,
    isAdminOrManager = false,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assignedAgentId) where.assignedAgentId = filter.assignedAgentId;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    // Agent scoping: agents only see their own leads unless admin/manager
    if (!isAdminOrManager && agentId) {
      where.assignedAgentId = agentId;
    }

    if (filter.search) {
      where.OR = [
        {
          client: {
            firstName: { contains: filter.search, mode: 'insensitive' },
          },
        },
        {
          client: {
            lastName: { contains: filter.search, mode: 'insensitive' },
          },
        },
        {
          client: {
            phone: { contains: filter.search },
          },
        },
        { notes: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
