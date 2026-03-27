import { Injectable } from '@nestjs/common';
import { PdfBaseTemplate } from '../pdf-base.template.js';

export interface MonthlyRevenueData {
  period: string;
  totalInvoiced: number;
  totalCollected: number;
  totalOverdue: number;
  invoicesByStatus: { status: string; count: number; amount: number }[];
  topProperties: { title: string; revenue: number }[];
}

export interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  period: string;
  leadsAssigned: number;
  leadsWon: number;
  leadsLost: number;
  conversionRate: number;
  contractsClosed: number;
  totalRevenue: number;
  activitiesLogged: number;
}

@Injectable()
export class ReportPdfTemplate extends PdfBaseTemplate {
  async generateMonthlyRevenue(data: MonthlyRevenueData): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(doc, `Monthly Revenue Report — ${data.period}`);

    // Summary cards
    this.addSection(doc, 'Revenue Summary');
    this.addLabelValue(doc, 'Total Invoiced:', this.formatCurrency(data.totalInvoiced));
    this.addLabelValue(doc, 'Total Collected:', this.formatCurrency(data.totalCollected));
    this.addLabelValue(doc, 'Total Overdue:', this.formatCurrency(data.totalOverdue));
    const collectionRate =
      data.totalInvoiced > 0
        ? ((data.totalCollected / data.totalInvoiced) * 100).toFixed(1)
        : '0.0';
    this.addLabelValue(doc, 'Collection Rate:', `${collectionRate}%`);
    doc.moveDown(1);

    // Invoices by status
    if (data.invoicesByStatus.length > 0) {
      this.addSection(doc, 'Invoices by Status');
      this.addTable(
        doc,
        ['Status', 'Count', 'Amount'],
        data.invoicesByStatus.map((s) => [
          s.status,
          String(s.count),
          this.formatCurrency(s.amount),
        ]),
        [180, 100, 210],
      );
      doc.moveDown(1);
    }

    // Top properties
    if (data.topProperties.length > 0) {
      this.addSection(doc, 'Top Properties by Revenue');
      this.addTable(
        doc,
        ['Property', 'Revenue'],
        data.topProperties.map((p) => [p.title, this.formatCurrency(p.revenue)]),
        [300, 190],
      );
    }

    this.addFooter(doc);
    return this.streamToBuffer(doc);
  }

  async generateAgentPerformance(data: AgentPerformanceData): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(doc, `Agent Performance Report — ${data.period}`);

    this.addSection(doc, 'Agent Information');
    this.addLabelValue(doc, 'Agent:', data.agentName);
    this.addLabelValue(doc, 'Period:', data.period);
    doc.moveDown(1);

    this.addSection(doc, 'Lead Performance');
    this.addTable(
      doc,
      ['Metric', 'Value'],
      [
        ['Leads Assigned', String(data.leadsAssigned)],
        ['Leads Won', String(data.leadsWon)],
        ['Leads Lost', String(data.leadsLost)],
        ['Conversion Rate', `${data.conversionRate.toFixed(1)}%`],
        ['Activities Logged', String(data.activitiesLogged)],
      ],
      [250, 240],
    );
    doc.moveDown(1);

    this.addSection(doc, 'Revenue Performance');
    this.addTable(
      doc,
      ['Metric', 'Value'],
      [
        ['Contracts Closed', String(data.contractsClosed)],
        ['Total Revenue', this.formatCurrency(data.totalRevenue)],
      ],
      [250, 240],
    );

    this.addFooter(doc);
    return this.streamToBuffer(doc);
  }
}
