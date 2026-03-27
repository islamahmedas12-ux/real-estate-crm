import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ContractStatus, PropertyStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { ContractFilterDto } from './dto/filter-contract.dto.js';
import { ChangeContractStatusDto } from './dto/change-status.dto.js';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto.js';
import { paginate, PaginatedResult } from '../common/dto/pagination.dto.js';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto, user: AuthenticatedUser) {
    // Validate property exists and is available
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new BadRequestException(
        `Property is not available (current status: ${property.status})`,
      );
    }

    // Validate client exists
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client ${dto.clientId} not found`);
    }

    // Determine new property status based on contract type
    const propertyStatusMap: Record<string, PropertyStatus> = {
      SALE: PropertyStatus.SOLD,
      RENT: PropertyStatus.RENTED,
      LEASE: PropertyStatus.RENTED,
    };
    const newPropertyStatus = propertyStatusMap[dto.type] ?? PropertyStatus.RESERVED;

    // Create contract and update property status in a transaction
    const contract = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          type: dto.type,
          propertyId: dto.propertyId,
          clientId: dto.clientId,
          agentId: dto.agentId ?? user.sub,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          totalAmount: dto.totalAmount,
          paymentTerms: (dto.paymentTerms as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          documentUrl: dto.documentUrl,
          notes: dto.notes,
        },
        include: {
          property: true,
          client: true,
          agent: true,
        },
      });

      await tx.property.update({
        where: { id: dto.propertyId },
        data: { status: newPropertyStatus },
      });

      return created;
    });

    return contract;
  }

  async findAll(
    filter: ContractFilterDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ContractWhereInput = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.clientId) where.clientId = filter.clientId;
    if (filter.propertyId) where.propertyId = filter.propertyId;
    if (filter.agentId) where.agentId = filter.agentId;

    if (filter.dateFrom || filter.dateTo) {
      where.startDate = {};
      if (filter.dateFrom) where.startDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.startDate.lte = new Date(filter.dateTo);
    }

    if (filter.search) {
      where.OR = [
        { notes: { contains: filter.search, mode: 'insensitive' } },
        { property: { title: { contains: filter.search, mode: 'insensitive' } } },
        { client: { firstName: { contains: filter.search, mode: 'insensitive' } } },
        { client: { lastName: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    // Agent role: only own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent) {
      where.agentId = user.sub;
    }

    const orderBy: Prisma.ContractOrderByWithRelationInput = {};
    const sortField = filter.sortBy ?? 'createdAt';
    if (['createdAt', 'startDate', 'endDate', 'totalAmount'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.ContractOrderByWithRelationInput] =
        filter.sortOrder ?? 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy,
        skip: filter.skip,
        take: filter.limit,
        include: {
          property: { select: { id: true, title: true, type: true, status: true, city: true } },
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          agent: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return paginate(data, total, filter);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        client: true,
        agent: true,
        invoices: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // Agent can only view own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent && contract.agentId !== user.sub) {
      throw new ForbiddenException('You can only view your own contracts');
    }

    return contract;
  }

  async update(id: string, dto: UpdateContractDto, user: AuthenticatedUser) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // Agent can only update own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent && existing.agentId !== user.sub) {
      throw new ForbiddenException('You can only update your own contracts');
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.agentId !== undefined && { agentId: dto.agentId }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.totalAmount !== undefined && { totalAmount: dto.totalAmount }),
        ...(dto.paymentTerms !== undefined && { paymentTerms: (dto.paymentTerms as Prisma.InputJsonValue) ?? Prisma.JsonNull }),
        ...(dto.documentUrl !== undefined && { documentUrl: dto.documentUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        property: true,
        client: true,
        agent: true,
      },
    });
  }

  async changeStatus(id: string, dto: ChangeContractStatusDto, user: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // Agent can only change status of own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent && contract.agentId !== user.sub) {
      throw new ForbiddenException('You can only change the status of your own contracts');
    }

    // Validate status transitions
    const validTransitions: Record<string, ContractStatus[]> = {
      DRAFT: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
      ACTIVE: [ContractStatus.COMPLETED, ContractStatus.CANCELLED, ContractStatus.EXPIRED],
      COMPLETED: [],
      CANCELLED: [],
      EXPIRED: [ContractStatus.ACTIVE],
    };

    const allowed = validTransitions[contract.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${contract.status} to ${dto.status}`,
      );
    }

    // Determine whether to restore property to AVAILABLE
    const shouldRestoreProperty =
      dto.status === ContractStatus.CANCELLED ||
      dto.status === ContractStatus.EXPIRED ||
      (dto.status === ContractStatus.COMPLETED &&
        (contract.type === 'RENT' || contract.type === 'LEASE'));

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.update({
        where: { id },
        data: { status: dto.status },
        include: { property: true, client: true },
      });

      if (shouldRestoreProperty) {
        await tx.property.update({
          where: { id: contract.propertyId },
          data: { status: PropertyStatus.AVAILABLE },
        });
      }

      return result;
    });

    return updated;
  }

  async findContractInvoices(contractId: string, user: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Agent can only view invoices for own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent && contract.agentId !== user.sub) {
      throw new ForbiddenException('You can only view invoices for your own contracts');
    }

    return this.prisma.invoice.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async generateInvoices(contractId: string, dto: GenerateInvoicesDto, user: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { invoices: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Agent can only generate invoices for own contracts
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent && contract.agentId !== user.sub) {
      throw new ForbiddenException('You can only generate invoices for your own contracts');
    }

    if (contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('Cannot generate invoices for a cancelled contract');
    }

    const paymentTerms = contract.paymentTerms as Record<string, unknown> | null;
    const installments = (paymentTerms?.installments as number) ?? 1;
    const totalAmount = Number(contract.totalAmount);
    const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

    const startDate = new Date(contract.startDate);
    const existingCount = contract.invoices.length;

    const invoices: Prisma.InvoiceCreateManyInput[] = [];
    for (let i = existingCount; i < installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Handle remainder on last installment
      const isLast = i === installments - 1;
      const amount = isLast
        ? totalAmount - installmentAmount * (installments - 1)
        : installmentAmount;

      invoices.push({
        contractId,
        invoiceNumber: `INV-${contractId.slice(0, 8).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        amount,
        dueDate,
        status: InvoiceStatus.PENDING,
        paymentMethod: dto.paymentMethod ?? null,
      });
    }

    if (invoices.length === 0) {
      throw new BadRequestException(
        'All invoices have already been generated for this contract',
      );
    }

    await this.prisma.invoice.createMany({ data: invoices });

    return this.prisma.invoice.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getStats(user: AuthenticatedUser) {
    const agentFilter: Prisma.ContractWhereInput = {};
    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent) {
      agentFilter.agentId = user.sub;
    }

    const [total, byStatus, byType, totalValue] = await Promise.all([
      this.prisma.contract.count({ where: agentFilter }),
      this.prisma.contract.groupBy({
        by: ['status'],
        _count: { id: true },
        where: agentFilter,
      }),
      this.prisma.contract.groupBy({
        by: ['type'],
        _count: { id: true },
        where: agentFilter,
      }),
      this.prisma.contract.aggregate({
        _sum: { totalAmount: true },
        where: { ...agentFilter, status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] } },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count.id])),
      totalValue: totalValue._sum.totalAmount ?? 0,
    };
  }

  async getExpiring(daysAhead = 30, user: AuthenticatedUser) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const where: Prisma.ContractWhereInput = {
      status: ContractStatus.ACTIVE,
      endDate: { gte: now, lte: future },
    };

    const isAgent =
      user.roles && !user.roles.includes('admin') && !user.roles.includes('manager');
    if (isAgent) {
      where.agentId = user.sub;
    }

    return this.prisma.contract.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: {
        property: { select: { id: true, title: true, city: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        agent: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
