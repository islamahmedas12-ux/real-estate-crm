import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: jest.Mocked<EmailService>;
  let prisma: any;

  const mockEmailService = {
    sendEmail: jest.fn(),
    retryEmail: jest.fn(),
  };

  const mockPrisma = {
    emailLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    emailPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockUser = {
    sub: 'user-123',
    email: 'user@test.com',
    roles: ['admin'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: mockEmailService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get(EmailService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should return paginated email logs', async () => {
      const logs = [{ id: '1', to: 'a@test.com', subject: 'Test', status: EmailStatus.SENT }];

      mockPrisma.emailLog.findMany.mockResolvedValue(logs);
      mockPrisma.emailLog.count.mockResolvedValue(1);

      const result = await controller.getLogs({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      } as any);

      expect(result).toEqual({
        data: logs,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      mockPrisma.emailLog.findMany.mockResolvedValue([]);
      mockPrisma.emailLog.count.mockResolvedValue(0);

      await controller.getLogs({
        page: 1,
        limit: 20,
        status: EmailStatus.FAILED,
        get skip() {
          return 0;
        },
      } as any);

      expect(mockPrisma.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: EmailStatus.FAILED }),
        }),
      );
    });
  });

  describe('getLog', () => {
    it('should return a single email log', async () => {
      const log = { id: '1', to: 'a@test.com', subject: 'Test' };
      mockPrisma.emailLog.findUnique.mockResolvedValue(log);

      const result = await controller.getLog('1');
      expect(result).toEqual(log);
    });

    it('should throw NotFoundException when log not found', async () => {
      mockPrisma.emailLog.findUnique.mockResolvedValue(null);

      await expect(controller.getLog('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendEmail', () => {
    it('should send a custom email', async () => {
      const dto = {
        to: 'test@example.com',
        subject: 'Hello',
        template: 'lead-assignment',
        context: { agentName: 'Test' },
      };

      const emailLog = { id: 'log-1', ...dto, status: EmailStatus.QUEUED };
      mockEmailService.sendEmail.mockResolvedValue(emailLog);

      const result = await controller.sendEmail(dto);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        dto.to,
        dto.subject,
        dto.template,
        dto.context,
      );
      expect(result).toEqual(emailLog);
    });
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      const prefs = {
        id: 'pref-1',
        userId: 'user-123',
        leadAssignment: true,
        followUpReminder: true,
      };
      mockPrisma.emailPreference.findUnique.mockResolvedValue(prefs);

      const result = await controller.getPreferences(mockUser as any);
      expect(result).toEqual(prefs);
    });

    it('should create default preferences if none exist', async () => {
      const defaultPrefs = {
        id: 'pref-1',
        userId: 'user-123',
        leadAssignment: true,
        followUpReminder: true,
        contractUpdates: true,
        invoiceReminder: true,
        paymentConfirmation: true,
        weeklySummary: true,
      };

      mockPrisma.emailPreference.findUnique.mockResolvedValue(null);
      mockPrisma.emailPreference.create.mockResolvedValue(defaultPrefs);

      const result = await controller.getPreferences(mockUser as any);
      expect(mockPrisma.emailPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-123' },
      });
      expect(result).toEqual(defaultPrefs);
    });
  });

  describe('updatePreferences', () => {
    it('should upsert preferences', async () => {
      const dto = { leadAssignment: false, weeklySummary: false };
      const updated = {
        id: 'pref-1',
        userId: 'user-123',
        ...dto,
      };

      mockPrisma.emailPreference.upsert.mockResolvedValue(updated);

      const result = await controller.updatePreferences(mockUser as any, dto);
      expect(mockPrisma.emailPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: dto,
        create: { userId: 'user-123', ...dto },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('retryEmail', () => {
    it('should retry a failed email', async () => {
      mockEmailService.retryEmail.mockResolvedValue({ message: 'Email re-queued for retry' });

      const result = await controller.retryEmail('log-1');
      expect(mockEmailService.retryEmail).toHaveBeenCalledWith('log-1');
      expect(result).toEqual({ message: 'Email re-queued for retry' });
    });
  });
});
