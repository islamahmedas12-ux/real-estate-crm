import { Injectable } from '@nestjs/common';
import { InvoiceStatus, LeadStatus, PropertyStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

interface RevenueParams {
  range?: string;
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  type?: string;
  agentId?: string;
}

interface LeadConversionParams {
  range?: string;
  from?: string;
  to?: string;
  agentId?: string;
  source?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(range?: string, from?: string, to?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'this_week': {
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'this_quarter': {
        const q = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), q, 1);
        break;
      }
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = to ? new Date(to) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return { start, end };
  }

  private formatPeriodKey(d: Date, groupBy: string): string {
    if (groupBy === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (groupBy === 'week') {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0] ?? '';
    }
    return d.toISOString().split('T')[0] ?? '';
  }

  async getRevenue(params: RevenueParams) {
    const { start, end } = this.getDateRange(params.range, params.from, params.to);
    const groupBy = params.groupBy ?? 'day';

    const where: Prisma.InvoiceWhereInput = {
      status: InvoiceStatus.PAID,
      paidDate: { gte: start, lte: end },
    };
    if (params.agentId) {
      where.contract = { property: { assignedAgentId: params.agentId } };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: { amount: true, paidDate: true },
      orderBy: { paidDate: 'asc' },
    });

    const grouped = new Map<string, { revenue: number; contracts: number }>();

    for (const inv of invoices) {
      const d: Date = inv.paidDate ?? new Date();
      const key = this.formatPeriodKey(d, groupBy);
      const existing = grouped.get(key) ?? { revenue: 0, contracts: 0 };
      existing.revenue += Number(inv.amount);
      existing.contracts += 1;
      grouped.set(key, existing);
    }

    const data = Array.from(grouped.entries()).map(([period, vals]) => ({
      period,
      revenue: vals.revenue,
      contracts: vals.contracts,
      avgDealSize: vals.contracts > 0 ? vals.revenue / vals.contracts : 0,
    }));

    return {
      data,
      total: data.reduce((sum, d) => sum + d.revenue, 0),
      period: { start: start.toISOString(), end: end.toISOString() },
    };
  }

  async getLeadConversion(params: LeadConversionParams) {
    const { start, end } = this.getDateRange(params.range, params.from, params.to);

    const where: Prisma.LeadWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    if (params.agentId) where.assignedAgentId = params.agentId;
    if (params.source) where.source = params.source;

    const leads = await this.prisma.lead.findMany({
      where,
      select: { source: true, status: true },
    });

    const sourceMap = new Map<string, { total: number; converted: number }>();
    let overallTotal = 0;
    let overallConverted = 0;

    for (const lead of leads) {
      const src: string = lead.source ?? 'UNKNOWN';
      const entry = sourceMap.get(src) ?? { total: 0, converted: 0 };
      entry.total += 1;
      if (lead.status === LeadStatus.WON) entry.converted += 1;
      sourceMap.set(src, entry);
      overallTotal += 1;
      if (lead.status === LeadStatus.WON) overallConverted += 1;
    }

    const bySource = Array.from(sourceMap.entries()).map(([source, vals]) => ({
      source,
      total: vals.total,
      converted: vals.converted,
      conversionRate: vals.total > 0 ? (vals.converted / vals.total) * 100 : 0,
    }));

    return {
      bySource,
      overall: {
        total: overallTotal,
        converted: overallConverted,
        conversionRate: overallTotal > 0 ? (overallConverted / overallTotal) * 100 : 0,
      },
      period: { start: start.toISOString(), end: end.toISOString() },
    };
  }

  async getProperties() {
    const properties = await this.prisma.property.findMany({
      select: { type: true, status: true, price: true },
    });

    const typeMap = new Map<
      string,
      {
        total: number;
        available: number;
        sold: number;
        rented: number;
        totalPrice: number;
      }
    >();
    const totals = { total: 0, available: 0, sold: 0, rented: 0 };

    for (const p of properties) {
      const entry = typeMap.get(p.type) ?? {
        total: 0,
        available: 0,
        sold: 0,
        rented: 0,
        totalPrice: 0,
      };
      entry.total += 1;
      entry.totalPrice += Number(p.price);
      if (p.status === PropertyStatus.AVAILABLE) entry.available += 1;
      if (p.status === PropertyStatus.SOLD) entry.sold += 1;
      if (p.status === PropertyStatus.RENTED) entry.rented += 1;
      typeMap.set(p.type, entry);

      totals.total += 1;
      if (p.status === PropertyStatus.AVAILABLE) totals.available += 1;
      if (p.status === PropertyStatus.SOLD) totals.sold += 1;
      if (p.status === PropertyStatus.RENTED) totals.rented += 1;
    }

    const byType = Array.from(typeMap.entries()).map(([type, vals]) => ({
      type,
      total: vals.total,
      available: vals.available,
      sold: vals.sold,
      rented: vals.rented,
      avgPrice: vals.total > 0 ? vals.totalPrice / vals.total : 0,
    }));

    return { byType, totals };
  }
}
