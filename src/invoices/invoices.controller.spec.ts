import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockUser: AuthenticatedUser = {
  sub: 'admin-uuid-001',
  email: 'admin@example.com',
  roles: ['admin'],
} as AuthenticatedUser;

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  recordPayment: jest.fn(),
  cancel: jest.fn(),
  findOverdue: jest.fn(),
  findUpcoming: jest.fn(),
  getStats: jest.fn(),
};

const sampleInvoice = {
  id: 'invoice-uuid-001',
  contractId: 'contract-uuid-001',
  invoiceNumber: 'INV-2026-0001',
  amount: 50000,
  dueDate: new Date('2026-04-01'),
  paidDate: null,
  status: InvoiceStatus.PENDING,
  paymentMethod: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: mockService }],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      mockService.create.mockResolvedValue(sampleInvoice);

      const dto = {
        contractId: 'contract-uuid-001',
        amount: 50000,
        dueDate: '2026-04-01',
      };

      const result = await controller.create(dto as any, mockUser);
      expect(result).toEqual(sampleInvoice);
      expect(mockService.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const paginated = {
        data: [sampleInvoice],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({} as any, mockUser);
      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith({}, mockUser);
    });
  });

  describe('getStats', () => {
    it('should return payment statistics', async () => {
      const stats = {
        total: 20,
        totalDue: 200000,
        totalCollected: 150000,
        totalOverdue: 30000,
        byStatus: {},
      };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockUser);
      expect(result.total).toBe(20);
      expect(result.totalCollected).toBe(150000);
      expect(mockService.getStats).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOverdue', () => {
    it('should return overdue invoices', async () => {
      const overdueList = [{ ...sampleInvoice, dueDate: new Date('2025-01-01') }];
      mockService.findOverdue.mockResolvedValue(overdueList);

      const result = await controller.findOverdue(mockUser);
      expect(result).toEqual(overdueList);
      expect(mockService.findOverdue).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findUpcoming', () => {
    it('should return upcoming invoices with default 30 days', async () => {
      mockService.findUpcoming.mockResolvedValue([sampleInvoice]);

      const result = await controller.findUpcoming(undefined, mockUser);
      expect(result).toHaveLength(1);
      expect(mockService.findUpcoming).toHaveBeenCalledWith(30, mockUser);
    });

    it('should pass custom days to service', async () => {
      mockService.findUpcoming.mockResolvedValue([]);

      await controller.findUpcoming('7', mockUser);
      expect(mockService.findUpcoming).toHaveBeenCalledWith(7, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return an invoice by ID', async () => {
      const withContract = {
        ...sampleInvoice,
        contract: { id: 'contract-uuid-001', type: 'SALE', property: {}, client: {} },
      };
      mockService.findOne.mockResolvedValue(withContract);

      const result = await controller.findOne(sampleInvoice.id, mockUser);
      expect(result.id).toBe(sampleInvoice.id);
      expect(mockService.findOne).toHaveBeenCalledWith(sampleInvoice.id, mockUser);
    });
  });

  describe('update', () => {
    it('should update an invoice', async () => {
      const updated = { ...sampleInvoice, amount: 60000 };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(sampleInvoice.id, { amount: 60000 }, mockUser);
      expect(result.amount).toBe(60000);
      expect(mockService.update).toHaveBeenCalledWith(
        sampleInvoice.id,
        { amount: 60000 },
        mockUser,
      );
    });
  });

  describe('recordPayment', () => {
    it('should record a payment', async () => {
      const paid = {
        ...sampleInvoice,
        status: InvoiceStatus.PAID,
        paidDate: new Date('2026-03-25'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };
      mockService.recordPayment.mockResolvedValue(paid);

      const dto = {
        paidDate: '2026-03-25',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };

      const result = await controller.recordPayment(sampleInvoice.id, dto as any, mockUser);
      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(mockService.recordPayment).toHaveBeenCalledWith(sampleInvoice.id, dto, mockUser);
    });
  });

  describe('cancel', () => {
    it('should cancel an invoice', async () => {
      const cancelled = { ...sampleInvoice, status: InvoiceStatus.CANCELLED };
      mockService.cancel.mockResolvedValue(cancelled);

      const result = await controller.cancel(sampleInvoice.id, mockUser);
      expect(result.status).toBe(InvoiceStatus.CANCELLED);
      expect(mockService.cancel).toHaveBeenCalledWith(sampleInvoice.id, mockUser);
    });
  });
});
