import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContractPdfTemplate } from './templates/contract.template.js';
import { InvoicePdfTemplate } from './templates/invoice.template.js';
import { ReportPdfTemplate } from './templates/report.template.js';
import type { MonthlyRevenueData, AgentPerformanceData } from './templates/report.template.js';
import { PropertyPdfTemplate } from './templates/property.template.js';
import { ReportType } from './dto/generate-report.dto.js';

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractTemplate: ContractPdfTemplate,
    private readonly invoiceTemplate: InvoicePdfTemplate,
    private readonly reportTemplate: ReportPdfTemplate,
    private readonly propertyTemplate: PropertyPdfTemplate,
  ) {}

  async generateContractPdf(contractId: string): Promise<Buffer> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { property: true, client: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    return this.contractTemplate.generate(contract);
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: { property: true, client: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    return this.invoiceTemplate.generate(invoice);
  }

  async generatePropertyPdf(propertyId: string): Promise<Buffer> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    return this.propertyTemplate.generate(property);
  }

  async generateReport(
    type: ReportType,
    month?: string,
    agentId?: string,
  ): Promise<Buffer> {
    // Validate month format if provided
    if (month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException(
        `Invalid month format: "${month}". Expected YYYY-MM (e.g. "2026-03")`,
      );
    }

    // Default to current month
    const now = new Date();
    const periodStr = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, mon] = periodStr.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    switch (type) {
      case ReportType.MONTHLY_REVENUE:
        return this.generateMonthlyRevenueReport(periodStr, startDate, endDate);
      case ReportType.AGENT_PERFORMANCE:
        if (!agentId) {
          throw new BadRequestException('agentId is required for agent_performance report');
        }
        return this.generateAgentPerformanceReport(agentId, periodStr, startDate, endDate);
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }

  private async generateMonthlyRevenueReport(
    period: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    // Invoices created in the period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
      },
      include: {
        contract: { include: { property: true } },
      },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalCollected = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // Group by status
    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const inv of invoices) {
      const entry = statusMap.get(inv.status) ?? { count: 0, amount: 0 };
      entry.count++;
      entry.amount += Number(inv.amount);
      statusMap.set(inv.status, entry);
    }

    // Top properties
    const propertyRevMap = new Map<string, { title: string; revenue: number }>();
    for (const inv of invoices.filter((i) => i.status === 'PAID')) {
      const key = inv.contract.propertyId;
      const entry = propertyRevMap.get(key) ?? {
        title: inv.contract.property.title,
        revenue: 0,
      };
      entry.revenue += Number(inv.amount);
      propertyRevMap.set(key, entry);
    }

    const data: MonthlyRevenueData = {
      period,
      totalInvoiced,
      totalCollected,
      totalOverdue,
      invoicesByStatus: Array.from(statusMap.entries()).map(([status, v]) => ({
        status,
        ...v,
      })),
      topProperties: Array.from(propertyRevMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };

    return this.reportTemplate.generateMonthlyRevenue(data);
  }

  private async generateAgentPerformanceReport(
    agentId: string,
    period: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const [leads, contracts, activities] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          assignedAgentId: agentId,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.contract.findMany({
        where: {
          agentId,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.leadActivity.findMany({
        where: {
          performedBy: agentId,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    const leadsWon = leads.filter((l) => l.status === 'WON').length;
    const leadsLost = leads.filter((l) => l.status === 'LOST').length;
    const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const data: AgentPerformanceData = {
      agentId,
      agentName: agentId, // Would be replaced with actual agent name from IAM
      period,
      leadsAssigned: leads.length,
      leadsWon,
      leadsLost,
      conversionRate: leads.length > 0 ? (leadsWon / leads.length) * 100 : 0,
      contractsClosed: contracts.filter((c) => c.status === 'COMPLETED').length,
      totalRevenue,
      activitiesLogged: activities.length,
    };

    return this.reportTemplate.generateAgentPerformance(data);
  }
}
