import { Injectable } from '@nestjs/common';
import { LeadStatus, ContractStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DateRangeDto, DateRangePreset } from './dto/date-range.dto.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Admin Endpoints ────────────────────────────────────────────────

  async getAdminOverview(dateRange: DateRangeDto) {
    const { start, end } = this.resolveDateRange(dateRange);
    const dateFilter = { gte: start, lte: end };

    const [
      totalProperties,
      totalClients,
      totalLeads,
      totalContracts,
      revenueResult,
      newPropertiesCount,
      newClientsCount,
      newLeadsCount,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.client.count(),
      this.prisma.lead.count(),
      this.prisma.contract.count(),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: InvoiceStatus.PAID },
      }),
      this.prisma.property.count({ where: { createdAt: dateFilter } }),
      this.prisma.client.count({ where: { createdAt: dateFilter } }),
      this.prisma.lead.count({ where: { createdAt: dateFilter } }),
    ]);

    return {
      totals: {
        properties: totalProperties,
        clients: totalClients,
        leads: totalLeads,
        contracts: totalContracts,
        revenue: revenueResult._sum.amount ?? 0,
      },
      period: {
        newProperties: newPropertiesCount,
        newClients: newClientsCount,
        newLeads: newLeadsCount,
        start,
        end,
      },
    };
  }

  async getAdminRevenue(dateRange: DateRangeDto) {
    const { start, end } = this.resolveDateRange(dateRange);

    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidDate: { gte: start, lte: end },
      },
      select: { amount: true, paidDate: true },
      orderBy: { paidDate: 'asc' },
    });

    // Group by date (YYYY-MM-DD)
    const dailyRevenue: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const day = inv.paidDate!.toISOString().slice(0, 10);
      dailyRevenue[day] = (dailyRevenue[day] ?? 0) + Number(inv.amount);
    }

    // Previous period for comparison
    const periodMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodMs);
    const prevEnd = new Date(start.getTime() - 1);

    const [currentTotal, previousTotal] = await Promise.all([
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: InvoiceStatus.PAID, paidDate: { gte: start, lte: end } },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: InvoiceStatus.PAID, paidDate: { gte: prevStart, lte: prevEnd } },
      }),
    ]);

    const current = Number(currentTotal._sum.amount ?? 0);
    const previous = Number(previousTotal._sum.amount ?? 0);
    const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : null;

    return {
      timeline: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })),
      total: current,
      previousPeriodTotal: previous,
      changePercent: changePercent !== null ? Math.round(changePercent * 100) / 100 : null,
      period: { start, end },
    };
  }

  async getAdminLeads(dateRange: DateRangeDto) {
    const { start, end } = this.resolveDateRange(dateRange);

    const [byStatus, byPriority, newLeads, wonLeads] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['priority'],
        _count: true,
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.lead.count({
        where: { status: LeadStatus.WON, updatedAt: { gte: start, lte: end } },
      }),
    ]);

    const total = byStatus.reduce((sum, g) => sum + g._count, 0);
    const conversionRate =
      total > 0
        ? Math.round(
            ((byStatus.find((g) => g.status === LeadStatus.WON)?._count ?? 0) / total) * 10000,
          ) / 100
        : 0;

    return {
      pipeline: byStatus.map((g) => ({ status: g.status, count: g._count })),
      byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
      newLeadsInPeriod: newLeads,
      wonLeadsInPeriod: wonLeads,
      conversionRate,
    };
  }

  async getAdminProperties() {
    const [byStatus, byType] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
      byType: byType.map((g) => ({ type: g.type, count: g._count })),
      total: byStatus.reduce((sum, g) => sum + g._count, 0),
    };
  }

  async getAdminAgents(dateRange: DateRangeDto) {
    const { start, end } = this.resolveDateRange(dateRange);

    // Get leads won per agent in the period
    const wonLeads = await this.prisma.lead.groupBy({
      by: ['assignedAgentId'],
      where: {
        status: LeadStatus.WON,
        updatedAt: { gte: start, lte: end },
        assignedAgentId: { not: null },
      },
      _count: true,
    });

    // Get revenue per agent (through contracts)
    const contracts = await this.prisma.contract.findMany({
      where: {
        status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] },
        createdAt: { gte: start, lte: end },
        agentId: { not: null },
      },
      select: { agentId: true, totalAmount: true },
    });

    const revenueByAgent: Record<string, number> = {};
    for (const c of contracts) {
      if (c.agentId) {
        revenueByAgent[c.agentId] = (revenueByAgent[c.agentId] ?? 0) + Number(c.totalAmount);
      }
    }

    // Get total leads per agent
    const totalLeads = await this.prisma.lead.groupBy({
      by: ['assignedAgentId'],
      where: { assignedAgentId: { not: null } },
      _count: true,
    });

    // Merge all agent IDs
    const agentIds = new Set<string>();
    wonLeads.forEach((w) => w.assignedAgentId && agentIds.add(w.assignedAgentId));
    Object.keys(revenueByAgent).forEach((id) => agentIds.add(id));
    totalLeads.forEach((t) => t.assignedAgentId && agentIds.add(t.assignedAgentId));

    const agents = Array.from(agentIds).map((agentId) => ({
      agentId,
      leadsWon: wonLeads.find((w) => w.assignedAgentId === agentId)?._count ?? 0,
      totalLeads: totalLeads.find((t) => t.assignedAgentId === agentId)?._count ?? 0,
      revenue: revenueByAgent[agentId] ?? 0,
    }));

    agents.sort((a, b) => b.revenue - a.revenue);

    return { agents, period: { start, end } };
  }

  async getAdminRecent(limit = 20) {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Agent Endpoints ────────────────────────────────────────────────

  async getAgentOverview(agentId: string) {
    const [properties, clients, leads, upcomingFollowUps] = await Promise.all([
      this.prisma.property.count({ where: { assignedAgentId: agentId } }),
      this.prisma.client.count({ where: { assignedAgentId: agentId } }),
      this.prisma.lead.count({ where: { assignedAgentId: agentId } }),
      this.prisma.lead.count({
        where: {
          assignedAgentId: agentId,
          nextFollowUp: { gte: new Date() },
          status: { notIn: [LeadStatus.WON, LeadStatus.LOST] },
        },
      }),
    ]);

    return {
      properties,
      clients,
      leads,
      upcomingFollowUps,
    };
  }

  async getAgentLeads(agentId: string) {
    const byStatus = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { assignedAgentId: agentId },
      _count: true,
    });

    return {
      pipeline: byStatus.map((g) => ({ status: g.status, count: g._count })),
      total: byStatus.reduce((sum, g) => sum + g._count, 0),
    };
  }

  async getAgentFollowUps(agentId: string) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [overdue, upcoming] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          assignedAgentId: agentId,
          nextFollowUp: { lt: now },
          status: { notIn: [LeadStatus.WON, LeadStatus.LOST] },
        },
        orderBy: { nextFollowUp: 'asc' },
        select: {
          id: true,
          status: true,
          priority: true,
          nextFollowUp: true,
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          property: { select: { id: true, title: true } },
        },
      }),
      this.prisma.lead.findMany({
        where: {
          assignedAgentId: agentId,
          nextFollowUp: { gte: now, lte: nextWeek },
          status: { notIn: [LeadStatus.WON, LeadStatus.LOST] },
        },
        orderBy: { nextFollowUp: 'asc' },
        select: {
          id: true,
          status: true,
          priority: true,
          nextFollowUp: true,
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          property: { select: { id: true, title: true } },
        },
      }),
    ]);

    return { overdue, upcoming };
  }

  async getAgentPerformance(agentId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

    const [
      thisMonthLeads,
      lastMonthLeads,
      thisMonthWon,
      lastMonthWon,
      thisMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.lead.count({
        where: { assignedAgentId: agentId, createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.lead.count({
        where: { assignedAgentId: agentId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      this.prisma.lead.count({
        where: {
          assignedAgentId: agentId,
          status: LeadStatus.WON,
          updatedAt: { gte: thisMonthStart },
        },
      }),
      this.prisma.lead.count({
        where: {
          assignedAgentId: agentId,
          status: LeadStatus.WON,
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      this.prisma.contract.aggregate({
        _sum: { totalAmount: true },
        where: {
          agentId,
          status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] },
          createdAt: { gte: thisMonthStart },
        },
      }),
      this.prisma.contract.aggregate({
        _sum: { totalAmount: true },
        where: {
          agentId,
          status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

    const thisRev = Number(thisMonthRevenue._sum.totalAmount ?? 0);
    const lastRev = Number(lastMonthRevenue._sum.totalAmount ?? 0);

    return {
      thisMonth: {
        leads: thisMonthLeads,
        won: thisMonthWon,
        revenue: thisRev,
      },
      lastMonth: {
        leads: lastMonthLeads,
        won: lastMonthWon,
        revenue: lastRev,
      },
      change: {
        leads: this.percentChange(lastMonthLeads, thisMonthLeads),
        won: this.percentChange(lastMonthWon, thisMonthWon),
        revenue: this.percentChange(lastRev, thisRev),
      },
    };
  }

  // ─── Mobile Dashboard ────────────────────────────────────────────────

  async getMobileDashboard(agentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      myLeads,
      myClients,
      myProperties,
      pendingFollowUps,
      todayFollowUps,
      recentActivities,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { assignedAgentId: agentId } }),
      this.prisma.client.count({ where: { assignedAgentId: agentId } }),
      this.prisma.property.count({ where: { assignedAgentId: agentId } }),
      this.prisma.lead.count({
        where: {
          assignedAgentId: agentId,
          nextFollowUp: { lte: tomorrow },
          status: { notIn: [LeadStatus.WON, LeadStatus.LOST] },
        },
      }),
      this.prisma.lead.findMany({
        where: {
          assignedAgentId: agentId,
          nextFollowUp: { gte: today, lt: tomorrow },
        },
        include: {
          client: { select: { firstName: true, lastName: true } },
          property: { select: { title: true } },
        },
        orderBy: { nextFollowUp: 'asc' },
        take: 20,
      }),
      this.prisma.leadActivity.findMany({
        where: { lead: { assignedAgentId: agentId } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    return {
      stats: { myLeads, myClients, myProperties, pendingFollowUps },
      todayFollowUps: todayFollowUps.map((fu) => ({
        id: fu.id,
        clientName: fu.client
          ? `${fu.client.firstName} ${fu.client.lastName}`
          : 'Unknown',
        propertyTitle: fu.property?.title ?? null,
        leadStatus: fu.status,
        scheduledAt: fu.nextFollowUp?.toISOString() ?? today.toISOString(),
        notes: fu.notes ?? null,
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description ?? `${a.type} activity`,
        entityType: 'LEAD',
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private percentChange(previous: number, current: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  private resolveDateRange(dto: DateRangeDto): { start: Date; end: Date } {
    const now = new Date();

    if (dto.range === DateRangePreset.CUSTOM && dto.from && dto.to) {
      return { start: dto.from, end: dto.to };
    }

    switch (dto.range) {
      case DateRangePreset.TODAY:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: now,
        };
      case DateRangePreset.THIS_WEEK: {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1; // Monday start
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        return { start, end: now };
      }
      case DateRangePreset.THIS_MONTH:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
      case DateRangePreset.LAST_MONTH:
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        };
      case DateRangePreset.THIS_QUARTER: {
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: now,
        };
      }
      case DateRangePreset.THIS_YEAR:
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
    }
  }
}
