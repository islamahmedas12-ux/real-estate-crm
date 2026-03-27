import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailStatus } from '@prisma/client';

interface EmailJobData {
  emailLogId: string;
  to: string;
  subject: string;
  html: string;
}

@Injectable()
@Processor('email')
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private baseTemplate!: Handlebars.TemplateDelegate;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  onModuleInit() {
    this.initTransporter();
    this.loadTemplates();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER', ''),
        pass: this.config.get<string>('SMTP_PASS', ''),
      },
    });
    this.logger.log('SMTP transporter initialized');
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    // Load base template
    const basePath = path.join(templatesDir, 'base.hbs');
    if (fs.existsSync(basePath)) {
      this.baseTemplate = Handlebars.compile(fs.readFileSync(basePath, 'utf-8'));
    } else {
      // Fallback: simple wrapper
      this.baseTemplate = Handlebars.compile('{{{body}}}');
      this.logger.warn('Base template not found, using fallback');
    }

    // Load all other templates
    const templateNames = [
      'lead-assignment',
      'follow-up-reminder',
      'contract-update',
      'invoice-reminder',
      'payment-received',
      'weekly-summary',
    ];

    for (const name of templateNames) {
      const filePath = path.join(templatesDir, `${name}.hbs`);
      if (fs.existsSync(filePath)) {
        this.templates.set(name, Handlebars.compile(fs.readFileSync(filePath, 'utf-8')));
      } else {
        this.logger.warn(`Template "${name}" not found at ${filePath}`);
      }
    }

    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  private renderTemplate(templateName: string, context: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new NotFoundException(`Email template "${templateName}" not found`);
    }

    const body = template(context);
    return this.baseTemplate({ ...context, body });
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any> = {},
  ) {
    // Create email log
    const emailLog = await this.prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        context: context as any,
        status: EmailStatus.QUEUED,
      },
    });

    // Add to queue
    await this.emailQueue.add(
      {
        emailLogId: emailLog.id,
        to,
        subject,
        html: this.renderTemplate(template, context),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Email queued: ${subject} -> ${to} (log: ${emailLog.id})`);
    return emailLog;
  }

  @Process()
  async processEmail(job: Job<EmailJobData>) {
    const { emailLogId, to, subject, html } = job.data;

    try {
      // Mark as sending
      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: EmailStatus.SENDING,
          attempts: { increment: 1 },
        },
      });

      const from = this.config.get<string>('EMAIL_FROM', 'noreply@realestate-crm.com');

      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      // Mark as sent
      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email sent successfully: ${subject} -> ${to}`);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);

      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: EmailStatus.FAILED,
          lastError: errMessage,
        },
      });

      this.logger.error(`Failed to send email: ${subject} -> ${to}: ${errMessage}`);
      throw error; // Re-throw so Bull retries
    }
  }

  async retryEmail(emailLogId: string) {
    const emailLog = await this.prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog) {
      throw new NotFoundException(`Email log "${emailLogId}" not found`);
    }

    if (emailLog.status !== EmailStatus.FAILED) {
      throw new BadRequestException('Only failed emails can be retried');
    }

    const html = this.renderTemplate(emailLog.template, (emailLog.context as Record<string, any>) ?? {});

    await this.prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: EmailStatus.QUEUED },
    });

    await this.emailQueue.add(
      {
        emailLogId: emailLog.id,
        to: emailLog.to,
        subject: emailLog.subject,
        html,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );

    return { message: 'Email re-queued for retry' };
  }

  // ─── Specific email senders ───────────────────────────────────────

  async sendLeadAssignmentEmail(
    agentEmail: string,
    agentName: string,
    lead: {
      clientName: string;
      clientPhone: string;
      status: string;
      priority: string;
      propertyTitle?: string;
      budget?: string;
      source?: string;
      notes?: string;
    },
  ) {
    return this.sendEmail(agentEmail, 'New Lead Assigned to You', 'lead-assignment', {
      agentName,
      lead,
    });
  }

  async sendFollowUpReminderEmail(
    agentEmail: string,
    agentName: string,
    leads: Array<{ clientName: string; priority: string }>,
  ) {
    return this.sendEmail(agentEmail, `Follow-Up Reminder: ${leads.length} lead(s) due today`, 'follow-up-reminder', {
      agentName,
      leads,
    });
  }

  async sendContractUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    contract: {
      id: string;
      type: string;
      status: string;
      propertyTitle: string;
      clientName: string;
      totalAmount: string;
      startDate: string;
      endDate?: string;
      notes?: string;
    },
    action: string,
  ) {
    return this.sendEmail(recipientEmail, `Contract ${action}`, 'contract-update', {
      recipientName,
      contract,
      action,
    });
  }

  async sendInvoiceReminderEmail(
    recipientEmail: string,
    recipientName: string,
    invoice: {
      invoiceNumber: string;
      amount: string;
      dueDate: string;
      status: string;
    },
    daysUntilDue: number,
  ) {
    return this.sendEmail(
      recipientEmail,
      daysUntilDue < 0
        ? `Invoice Overdue: ${invoice.invoiceNumber}`
        : `Invoice Reminder: ${invoice.invoiceNumber}`,
      'invoice-reminder',
      {
        recipientName,
        invoice,
        daysUntilDue: Math.abs(daysUntilDue),
        isOverdue: daysUntilDue < 0,
        isDueToday: daysUntilDue === 0,
      },
    );
  }

  async sendPaymentReceivedEmail(
    recipientEmail: string,
    recipientName: string,
    invoice: {
      invoiceNumber: string;
      amount: string;
      paidDate: string;
      paymentMethod?: string;
    },
  ) {
    return this.sendEmail(recipientEmail, `Payment Confirmation: ${invoice.invoiceNumber}`, 'payment-received', {
      recipientName,
      invoice,
    });
  }

  async sendWeeklySummaryEmail(
    agentEmail: string,
    agentName: string,
    stats: {
      newLeads: number;
      leadsWon: number;
      leadsLost: number;
      activeLeads: number;
      followUpsDue: number;
      contractsCreated: number;
      invoicesPending: number;
      revenueCollected: string;
      upcomingFollowUps: Array<{ clientName: string; date: string }>;
    },
  ) {
    return this.sendEmail(agentEmail, 'Your Weekly Summary', 'weekly-summary', {
      agentName,
      stats,
    });
  }
}
