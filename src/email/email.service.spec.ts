import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';

describe('EmailService', () => {
  let service: EmailService;
  let prisma: jest.Mocked<PrismaService>;
  let queue: { add: jest.Mock };

  const mockPrisma = {
    emailLog: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const map: Record<string, any> = {
        SMTP_HOST: 'localhost',
        SMTP_PORT: 587,
        SMTP_USER: 'test',
        SMTP_PASS: 'test',
        EMAIL_FROM: 'test@example.com',
      };
      return map[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getQueueToken('email'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prisma = module.get(PrismaService);
    queue = module.get(getQueueToken('email'));

    // Initialize transporter and load templates
    service.onModuleInit();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should create an email log and add job to queue', async () => {
      const emailLog = {
        id: 'test-id',
        to: 'test@example.com',
        subject: 'Test',
        template: 'lead-assignment',
        status: EmailStatus.QUEUED,
        context: {},
        attempts: 0,
        lastError: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailLog.create.mockResolvedValue(emailLog);
      mockQueue.add.mockResolvedValue({});

      const result = await service.sendEmail(
        'test@example.com',
        'Test',
        'lead-assignment',
        { agentName: 'John', lead: {} },
      );

      expect(mockPrisma.emailLog.create).toHaveBeenCalledWith({
        data: {
          to: 'test@example.com',
          subject: 'Test',
          template: 'lead-assignment',
          context: { agentName: 'John', lead: {} },
          status: EmailStatus.QUEUED,
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          emailLogId: 'test-id',
          to: 'test@example.com',
          subject: 'Test',
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );

      expect(result).toEqual(emailLog);
    });
  });

  describe('retryEmail', () => {
    it('should throw error if email log not found', async () => {
      mockPrisma.emailLog.findUnique.mockResolvedValue(null);

      await expect(service.retryEmail('non-existent')).rejects.toThrow(
        'Email log "non-existent" not found',
      );
    });

    it('should throw error if email is not in FAILED status', async () => {
      mockPrisma.emailLog.findUnique.mockResolvedValue({
        id: 'test-id',
        status: EmailStatus.SENT,
        template: 'lead-assignment',
        context: {},
      });

      await expect(service.retryEmail('test-id')).rejects.toThrow(
        'Only failed emails can be retried',
      );
    });

    it('should re-queue a failed email', async () => {
      mockPrisma.emailLog.findUnique.mockResolvedValue({
        id: 'test-id',
        to: 'test@example.com',
        subject: 'Test',
        status: EmailStatus.FAILED,
        template: 'lead-assignment',
        context: { agentName: 'John', lead: {} },
      });
      mockPrisma.emailLog.update.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      const result = await service.retryEmail('test-id');

      expect(mockPrisma.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { status: EmailStatus.QUEUED },
      });
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Email re-queued for retry' });
    });
  });

  describe('sendLeadAssignmentEmail', () => {
    it('should call sendEmail with correct parameters', async () => {
      const emailLog = {
        id: 'log-id',
        to: 'agent@test.com',
        subject: 'New Lead Assigned to You',
        template: 'lead-assignment',
        status: EmailStatus.QUEUED,
        context: {},
        attempts: 0,
        lastError: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailLog.create.mockResolvedValue(emailLog);
      mockQueue.add.mockResolvedValue({});

      await service.sendLeadAssignmentEmail('agent@test.com', 'Agent Smith', {
        clientName: 'John Doe',
        clientPhone: '+123456789',
        status: 'NEW',
        priority: 'HIGH',
      });

      expect(mockPrisma.emailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            to: 'agent@test.com',
            subject: 'New Lead Assigned to You',
            template: 'lead-assignment',
          }),
        }),
      );
    });
  });

  describe('sendFollowUpReminderEmail', () => {
    it('should call sendEmail with correct parameters', async () => {
      const emailLog = {
        id: 'log-id',
        to: 'agent@test.com',
        subject: 'Follow-Up Reminder: 2 lead(s) due today',
        template: 'follow-up-reminder',
        status: EmailStatus.QUEUED,
        context: {},
        attempts: 0,
        lastError: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailLog.create.mockResolvedValue(emailLog);
      mockQueue.add.mockResolvedValue({});

      await service.sendFollowUpReminderEmail('agent@test.com', 'Agent Smith', [
        { clientName: 'John', priority: 'HIGH' },
        { clientName: 'Jane', priority: 'MEDIUM' },
      ]);

      expect(mockPrisma.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendInvoiceReminderEmail', () => {
    it('should handle overdue invoices', async () => {
      const emailLog = {
        id: 'log-id',
        to: 'client@test.com',
        subject: 'Invoice Overdue: INV-001',
        template: 'invoice-reminder',
        status: EmailStatus.QUEUED,
        context: {},
        attempts: 0,
        lastError: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailLog.create.mockResolvedValue(emailLog);
      mockQueue.add.mockResolvedValue({});

      await service.sendInvoiceReminderEmail(
        'client@test.com',
        'John Doe',
        {
          invoiceNumber: 'INV-001',
          amount: '5000',
          dueDate: '2026-03-20',
          status: 'OVERDUE',
        },
        -5,
      );

      expect(mockPrisma.emailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: 'Invoice Overdue: INV-001',
          }),
        }),
      );
    });
  });
});
