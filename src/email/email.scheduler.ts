import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from './email.service.js';

@Injectable()
export class EmailScheduler {
  private readonly logger = new Logger(EmailScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Daily at 8:00 AM — send follow-up reminders for leads with nextFollowUp today.
   */
  @Cron('0 8 * * *')
  async handleFollowUpReminders() {
    this.logger.log('Running follow-up reminder check...');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const leads = await this.prisma.lead.findMany({
      where: {
        nextFollowUp: {
          gte: todayStart,
          lte: todayEnd,
        },
        assignedAgentId: { not: null },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (leads.length === 0) {
      this.logger.log('No follow-up reminders to send today');
      return;
    }

    // Group leads by agent
    const byAgent = new Map<string, typeof leads>();
    for (const lead of leads) {
      const agentId = lead.assignedAgentId!;
      if (!byAgent.has(agentId)) {
        byAgent.set(agentId, []);
      }
      byAgent.get(agentId)!.push(lead);
    }

    for (const [agentId, agentLeads] of byAgent) {
      try {
        const agent = await this.prisma.user.findUnique({
          where: { id: agentId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (!agent?.email) {
          this.logger.warn(`Agent ${agentId} has no email — skipping follow-up reminder`);
          continue;
        }
        const agentEmail = agent.email;
        const agentName = [agent.firstName, agent.lastName].filter(Boolean).join(' ') || agentId;

        const leadData = agentLeads.map((l) => ({
          clientName: `${l.client.firstName} ${l.client.lastName}`,
          priority: l.priority,
        }));

        await this.emailService.sendFollowUpReminderEmail(agentEmail, agentName, leadData);
        this.logger.log(
          `Follow-up reminder sent to agent ${agentId} for ${agentLeads.length} lead(s)`,
        );
      } catch (error) {
        this.logger.error(`Failed to send follow-up reminder to agent ${agentId}`, error);
      }
    }
  }

  /**
   * Daily at 9:00 AM — send invoice reminders for invoices due in 3 days, today, or overdue.
   */
  @Cron('0 9 * * *')
  async handleInvoiceReminders() {
    this.logger.log('Running invoice reminder check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING'] },
        dueDate: { lte: threeDaysFromNow },
      },
      include: {
        contract: {
          include: {
            client: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (invoices.length === 0) {
      this.logger.log('No invoice reminders to send today');
      return;
    }

    for (const invoice of invoices) {
      try {
        const client = invoice.contract.client;
        if (!client.email) continue;

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        await this.emailService.sendInvoiceReminderEmail(
          client.email,
          `${client.firstName} ${client.lastName}`,
          {
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount.toString(),
            dueDate: invoice.dueDate.toISOString().split('T')[0],
            status: invoice.status,
          },
          daysUntilDue,
        );
        this.logger.log(`Invoice reminder sent for ${invoice.invoiceNumber} to ${client.email}`);
      } catch (error) {
        this.logger.error(`Failed to send invoice reminder for ${invoice.invoiceNumber}`, error);
      }
    }
  }

  /**
   * Every Monday at 9:00 AM — send weekly summary to agents.
   */
  @Cron('0 9 * * 1')
  async handleWeeklySummary() {
    this.logger.log('Running weekly summary generation...');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    // Get distinct agent IDs from leads
    const agents = await this.prisma.lead.groupBy({
      by: ['assignedAgentId'],
      where: { assignedAgentId: { not: null } },
    });

    for (const agent of agents) {
      const agentId = agent.assignedAgentId;
      if (!agentId) continue;

      try {
        const [
          newLeads,
          leadsWon,
          leadsLost,
          activeLeads,
          followUpsDue,
          contractsCreated,
          pendingInvoices,
          upcomingFollowUps,
        ] = await Promise.all([
          this.prisma.lead.count({
            where: { assignedAgentId: agentId, createdAt: { gte: oneWeekAgo } },
          }),
          this.prisma.lead.count({
            where: { assignedAgentId: agentId, status: 'WON', updatedAt: { gte: oneWeekAgo } },
          }),
          this.prisma.lead.count({
            where: { assignedAgentId: agentId, status: 'LOST', updatedAt: { gte: oneWeekAgo } },
          }),
          this.prisma.lead.count({
            where: {
              assignedAgentId: agentId,
              status: { notIn: ['WON', 'LOST'] },
            },
          }),
          this.prisma.lead.count({
            where: {
              assignedAgentId: agentId,
              nextFollowUp: { lte: nextWeek, gte: new Date() },
            },
          }),
          this.prisma.contract.count({
            where: { agentId, createdAt: { gte: oneWeekAgo } },
          }),
          this.prisma.invoice.count({
            where: {
              contract: { agentId },
              status: 'PENDING',
            },
          }),
          this.prisma.lead.findMany({
            where: {
              assignedAgentId: agentId,
              nextFollowUp: { gte: new Date(), lte: nextWeek },
            },
            include: {
              client: { select: { firstName: true, lastName: true } },
            },
            orderBy: { nextFollowUp: 'asc' },
            take: 10,
          }),
        ]);

        const agentUser = await this.prisma.user.findUnique({
          where: { id: agentId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (!agentUser?.email) {
          this.logger.warn(`Agent ${agentId} has no email — skipping weekly summary`);
          continue;
        }
        const agentEmail = agentUser.email;
        const agentName =
          [agentUser.firstName, agentUser.lastName].filter(Boolean).join(' ') || agentId;

        await this.emailService.sendWeeklySummaryEmail(agentEmail, agentName, {
          newLeads,
          leadsWon,
          leadsLost,
          activeLeads,
          followUpsDue,
          contractsCreated,
          invoicesPending: pendingInvoices,
          revenueCollected: '0', // Would need aggregation on paid invoices
          upcomingFollowUps: upcomingFollowUps.map((l) => ({
            clientName: `${l.client.firstName} ${l.client.lastName}`,
            date: l.nextFollowUp?.toISOString().split('T')[0] ?? 'N/A',
          })),
        });

        this.logger.log(`Weekly summary sent to agent ${agentId}`);
      } catch (error) {
        this.logger.error(`Failed to send weekly summary to agent ${agentId}`, error);
      }
    }
  }
}
