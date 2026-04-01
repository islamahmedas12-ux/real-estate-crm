import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListParams) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(role ? { role: role as UserRole } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              assignedProperties: true,
              assignedClients: true,
              assignedLeads: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        assignedProperties: {
          select: { id: true, title: true, status: true, price: true, type: true },
          take: 50,
        },
        assignedClients: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          take: 50,
        },
        assignedLeads: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            source: true,
            createdAt: true,
          },
          take: 50,
        },
        _count: {
          select: {
            assignedProperties: true,
            assignedClients: true,
            assignedLeads: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Compute performance metrics
    const [leadsWon, revenueResult] = await Promise.all([
      this.prisma.lead.count({
        where: { agentId: id, status: 'WON' },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          contract: { agentId: id },
        },
      }),
    ]);

    const totalLeads = user._count.assignedLeads;
    const revenue = Number(revenueResult._sum.amount ?? 0);

    return {
      ...user,
      performance: {
        totalLeads,
        leadsWon,
        revenue,
        conversionRate: totalLeads > 0 ? (leadsWon / totalLeads) * 100 : 0,
      },
    };
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }
}
