import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ContractType,
  ContractStatus,
  PropertyStatus,
  InvoiceStatus,
  UserRole,
} from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockPrisma: Record<string, any> = {
  contract: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  property: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((fn: (prisma: any) => any) => fn(mockPrisma)),
};

const adminUser: AuthenticatedUser = {
  id: 'user-001',
  authmeId: 'admin-001',
  sub: 'admin-001',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  roles: ['admin'],
  isActive: true,
};

const agentUser: AuthenticatedUser = {
  id: 'user-002',
  authmeId: 'agent-001',
  sub: 'agent-001',
  email: 'agent@test.com',
  firstName: 'Agent',
  lastName: 'User',
  role: UserRole.AGENT,
  roles: ['agent'],
  isActive: true,
};

const mockProperty = {
  id: 'prop-001',
  title: 'Test Property',
  status: PropertyStatus.AVAILABLE,
};

const mockClient = {
  id: 'client-001',
  firstName: 'John',
  lastName: 'Doe',
};

const mockContract = {
  id: 'contract-001',
  type: ContractType.SALE,
  propertyId: 'prop-001',
  clientId: 'client-001',
  agentId: 'admin-001',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2027-01-01'),
  totalAmount: 100000,
  paymentTerms: { installments: 12, frequency: 'monthly' },
  status: ContractStatus.DRAFT,
  notes: null,
  documentUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  property: mockProperty,
  client: mockClient,
  invoices: [],
};

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contract and update property status', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.contract.create.mockResolvedValue(mockContract);
      mockPrisma.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.SOLD,
      });

      const result = await service.create(
        {
          type: ContractType.SALE,
          propertyId: 'prop-001',
          clientId: 'client-001',
          startDate: '2026-01-01',
          totalAmount: 100000,
        },
        adminUser,
      );

      expect(result).toEqual(mockContract);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-001' },
        data: { status: PropertyStatus.SOLD },
      });
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            type: ContractType.SALE,
            propertyId: 'nonexistent',
            clientId: 'client-001',
            startDate: '2026-01-01',
            totalAmount: 100000,
          },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if property is not available', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.SOLD,
      });

      await expect(
        service.create(
          {
            type: ContractType.SALE,
            propertyId: 'prop-001',
            clientId: 'client-001',
            startDate: '2026-01-01',
            totalAmount: 100000,
          },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if client not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            type: ContractType.SALE,
            propertyId: 'prop-001',
            clientId: 'nonexistent',
            startDate: '2026-01-01',
            totalAmount: 100000,
          },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a contract with relations', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);

      const result = await service.findOne('contract-001', adminUser);
      expect(result).toEqual(mockContract);
    });

    it('should throw if contract not found', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for agent viewing another agent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        agentId: 'other-agent',
      });

      await expect(service.findOne('contract-001', agentUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changeStatus', () => {
    it('should change DRAFT to ACTIVE', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.ACTIVE,
      });

      const result = await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.ACTIVE,
        },
        adminUser,
      );

      expect(result.status).toBe(ContractStatus.ACTIVE);
    });

    it('should reject invalid transition (COMPLETED -> DRAFT)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.COMPLETED,
      });

      await expect(
        service.changeStatus('contract-001', { status: ContractStatus.DRAFT }, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should restore property status on cancellation', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.ACTIVE,
      });
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.CANCELLED,
      });
      mockPrisma.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.AVAILABLE,
      });

      await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.CANCELLED,
        },
        adminUser,
      );

      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-001' },
        data: { status: PropertyStatus.AVAILABLE },
      });
    });

    it('should throw ForbiddenException for agent changing another agent contract status', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        agentId: 'other-agent',
      });

      await expect(
        service.changeStatus('contract-001', { status: ContractStatus.ACTIVE }, agentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should restore property to AVAILABLE when RENT contract is completed', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        type: ContractType.RENT,
        status: ContractStatus.ACTIVE,
      });
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        type: ContractType.RENT,
        status: ContractStatus.COMPLETED,
      });
      mockPrisma.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.AVAILABLE,
      });

      await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.COMPLETED,
        },
        adminUser,
      );

      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-001' },
        data: { status: PropertyStatus.AVAILABLE },
      });
    });

    it('should restore property to AVAILABLE when LEASE contract is completed', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        type: ContractType.LEASE,
        status: ContractStatus.ACTIVE,
      });
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        type: ContractType.LEASE,
        status: ContractStatus.COMPLETED,
      });
      mockPrisma.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.AVAILABLE,
      });

      await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.COMPLETED,
        },
        adminUser,
      );

      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-001' },
        data: { status: PropertyStatus.AVAILABLE },
      });
    });

    it('should NOT restore property when SALE contract is completed', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        type: ContractType.SALE,
        status: ContractStatus.ACTIVE,
      });
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        type: ContractType.SALE,
        status: ContractStatus.COMPLETED,
      });

      await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.COMPLETED,
        },
        adminUser,
      );

      expect(mockPrisma.property.update).not.toHaveBeenCalled();
    });

    it('should allow agent to change own contract status', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        agentId: 'agent-001',
      });
      mockPrisma.contract.update.mockResolvedValue({
        ...mockContract,
        agentId: 'agent-001',
        status: ContractStatus.ACTIVE,
      });

      const result = await service.changeStatus(
        'contract-001',
        {
          status: ContractStatus.ACTIVE,
        },
        agentUser,
      );

      expect(result.status).toBe(ContractStatus.ACTIVE);
    });
  });

  describe('findContractInvoices', () => {
    it('should return invoices for a contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const result = await service.findContractInvoices('contract-001', adminUser);
      expect(result).toEqual([]);
    });

    it('should throw ForbiddenException for agent viewing another agent contract invoices', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        agentId: 'other-agent',
      });

      await expect(service.findContractInvoices('contract-001', agentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('generateInvoices', () => {
    it('should generate invoices based on payment terms', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.invoice.createMany.mockResolvedValue({ count: 12 });
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.generateInvoices('contract-001', {}, adminUser);

      expect(mockPrisma.invoice.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            contractId: 'contract-001',
            status: InvoiceStatus.PENDING,
          }),
        ]),
      });
    });

    it('should throw for cancelled contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.CANCELLED,
      });

      await expect(service.generateInvoices('contract-001', {}, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException for agent generating invoices for another agent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        agentId: 'other-agent',
      });

      await expect(service.generateInvoices('contract-001', {}, agentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getStats', () => {
    it('should return contract statistics', async () => {
      mockPrisma.contract.count.mockResolvedValue(10);
      mockPrisma.contract.groupBy
        .mockResolvedValueOnce([
          { status: ContractStatus.ACTIVE, _count: { id: 5 } },
          { status: ContractStatus.DRAFT, _count: { id: 3 } },
        ])
        .mockResolvedValueOnce([
          { type: ContractType.SALE, _count: { id: 6 } },
          { type: ContractType.RENT, _count: { id: 4 } },
        ]);
      mockPrisma.contract.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500000 },
      });

      const result = await service.getStats(adminUser);

      expect(result.total).toBe(10);
      expect(result.byStatus.ACTIVE).toBe(5);
      expect(result.byType.SALE).toBe(6);
      expect(result.totalValue).toBe(500000);
    });
  });
});
