import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const adminUser: AuthenticatedUser = {
  sub: 'admin-uuid-001',
  email: 'admin@example.com',
  roles: ['admin'],
} as AuthenticatedUser;

const agentUser: AuthenticatedUser = {
  sub: 'agent-uuid-001',
  email: 'agent@example.com',
  roles: ['agent'],
} as AuthenticatedUser;

const mockPrisma = {
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  contract: {
    findUnique: jest.fn(),
  },
};

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  const sampleContract = {
    id: 'contract-uuid-001',
    type: 'SALE',
    status: 'ACTIVE',
    totalAmount: 500000,
    agentId: agentUser.sub,
  };

  const sampleInvoice = {
    id: 'invoice-uuid-001',
    contractId: sampleContract.id,
    invoiceNumber: 'INV-2026-0001',
    amount: 50000,
    dueDate: new Date('2026-04-01'),
    paidDate: null,
    status: InvoiceStatus.PENDING,
    paymentMethod: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contract: { agentId: agentUser.sub },
  };

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an invoice with an auto-generated invoice number', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(sampleContract);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({
        ...sampleInvoice,
        invoiceNumber: 'INV-2026-0001',
      });

      const result = await service.create(
        {
          contractId: sampleContract.id,
          amount: 50000,
          dueDate: '2026-04-01',
        },
        adminUser,
      );

      expect(result.invoiceNumber).toBe('INV-2026-0001');
      expect(mockPrisma.invoice.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { contractId: 'nonexistent', amount: 1000, dueDate: '2026-04-01' },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should increment invoice number when invoices already exist for the year', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(sampleContract);
      mockPrisma.invoice.count.mockResolvedValue(5);
      mockPrisma.invoice.create.mockResolvedValue({
        ...sampleInvoice,
        invoiceNumber: 'INV-2026-0006',
      });

      const result = await service.create(
        {
          contractId: sampleContract.id,
          amount: 25000,
          dueDate: '2026-05-01',
        },
        adminUser,
      );

      expect(result.invoiceNumber).toBe('INV-2026-0006');
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const invoices = [{ ...sampleInvoice }];
      mockPrisma.invoice.findMany.mockResolvedValue(invoices);
      mockPrisma.invoice.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, skip: 0 } as any, adminUser);

      expect(result.data).toEqual(invoices);
      expect(result.total).toBe(1);
    });

    it('should apply overdue filter', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, skip: 0, overdue: 'true' } as any, adminUser);

      const call = mockPrisma.invoice.findMany.mock.calls[0][0];
      expect(call.where.status).toBe(InvoiceStatus.PENDING);
      expect(call.where.dueDate).toBeDefined();
    });

    it('should filter by status', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await service.findAll(
        {
          page: 1,
          limit: 20,
          skip: 0,
          status: InvoiceStatus.PAID,
        } as any,
        adminUser,
      );

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: InvoiceStatus.PAID }),
        }),
      );
    });

    it('should filter by contractId', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await service.findAll(
        {
          page: 1,
          limit: 20,
          skip: 0,
          contractId: sampleContract.id,
        } as any,
        adminUser,
      );

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contractId: sampleContract.id }),
        }),
      );
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an invoice with contract details', async () => {
      const invoiceWithContract = {
        ...sampleInvoice,
        contract: { ...sampleContract, property: {}, client: {} },
      };
      mockPrisma.invoice.findUnique.mockResolvedValue(invoiceWithContract);

      const result = await service.findOne(sampleInvoice.id, adminUser);
      expect(result.id).toBe(sampleInvoice.id);
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a pending invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(sampleInvoice);
      const updated = { ...sampleInvoice, amount: 60000 };
      mockPrisma.invoice.update.mockResolvedValue(updated);

      const result = await service.update(sampleInvoice.id, { amount: 60000 }, adminUser);
      expect(result.amount).toBe(60000);
    });

    it('should throw BadRequestException when updating a paid invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(service.update(sampleInvoice.id, { amount: 60000 }, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when updating a cancelled invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(service.update(sampleInvoice.id, { notes: 'test' }, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── recordPayment ────────────────────────────────────────────────────────

  describe('recordPayment', () => {
    it('should mark a pending invoice as paid', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(sampleInvoice);
      const paid = {
        ...sampleInvoice,
        status: InvoiceStatus.PAID,
        paidDate: new Date('2026-03-25'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };
      mockPrisma.invoice.update.mockResolvedValue(paid);

      const result = await service.recordPayment(
        sampleInvoice.id,
        {
          paidDate: '2026-03-25',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
        },
        adminUser,
      );

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
    });

    it('should throw BadRequestException when invoice is already paid', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(
        service.recordPayment(
          sampleInvoice.id,
          {
            paidDate: '2026-03-25',
            paymentMethod: PaymentMethod.CASH,
          },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invoice is cancelled', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(
        service.recordPayment(
          sampleInvoice.id,
          {
            paidDate: '2026-03-25',
            paymentMethod: PaymentMethod.CASH,
          },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel a pending invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(sampleInvoice);
      const cancelled = { ...sampleInvoice, status: InvoiceStatus.CANCELLED };
      mockPrisma.invoice.update.mockResolvedValue(cancelled);

      const result = await service.cancel(sampleInvoice.id, adminUser);
      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should throw BadRequestException when cancelling a paid invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(service.cancel(sampleInvoice.id, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when invoice is already cancelled', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sampleInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(service.cancel(sampleInvoice.id, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findOverdue ──────────────────────────────────────────────────────────

  describe('findOverdue', () => {
    it('should return overdue pending invoices', async () => {
      const overdueInvoice = {
        ...sampleInvoice,
        dueDate: new Date('2025-01-01'),
      };
      mockPrisma.invoice.findMany.mockResolvedValue([overdueInvoice]);

      const result = await service.findOverdue(adminUser);

      expect(result).toHaveLength(1);
      const call = mockPrisma.invoice.findMany.mock.calls[0][0];
      expect(call.where.status).toBe(InvoiceStatus.PENDING);
      expect(call.where.dueDate.lt).toBeInstanceOf(Date);
    });
  });

  // ─── findUpcoming ─────────────────────────────────────────────────────────

  describe('findUpcoming', () => {
    it('should return invoices due in the next 30 days by default', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([sampleInvoice]);

      const result = await service.findUpcoming();

      expect(result).toHaveLength(1);
      const call = mockPrisma.invoice.findMany.mock.calls[0][0];
      expect(call.where.status).toBe(InvoiceStatus.PENDING);
      expect(call.where.dueDate.gte).toBeInstanceOf(Date);
      expect(call.where.dueDate.lte).toBeInstanceOf(Date);
    });

    it('should accept a custom days parameter', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.findUpcoming(7);

      const call = mockPrisma.invoice.findMany.mock.calls[0][0];
      const diffDays =
        (call.where.dueDate.lte.getTime() - call.where.dueDate.gte.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated payment statistics', async () => {
      mockPrisma.invoice.count.mockResolvedValue(20);
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 200000 } }) // totalDue
        .mockResolvedValueOnce({ _sum: { amount: 150000 } }) // totalCollected
        .mockResolvedValueOnce({ _sum: { amount: 30000 } }); // totalOverdue
      mockPrisma.invoice.groupBy.mockResolvedValue([
        { status: InvoiceStatus.PENDING, _count: { id: 8 }, _sum: { amount: 200000 } },
        { status: InvoiceStatus.PAID, _count: { id: 10 }, _sum: { amount: 150000 } },
        { status: InvoiceStatus.CANCELLED, _count: { id: 2 }, _sum: { amount: 50000 } },
      ]);

      const stats = await service.getStats(adminUser);

      expect(stats.total).toBe(20);
      expect(stats.totalDue).toBe(200000);
      expect(stats.totalCollected).toBe(150000);
      expect(stats.totalOverdue).toBe(30000);
      expect(stats.byStatus).toHaveProperty(InvoiceStatus.PENDING);
      expect(stats.byStatus[InvoiceStatus.PAID].count).toBe(10);
    });
  });
});
