import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientType, ClientSource } from '@prisma/client';

const mockPrisma = {
  client: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  lead: { findMany: jest.fn() },
  contract: { findMany: jest.fn() },
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  const sampleClient = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'ahmed@example.com',
    phone: '+201234567890',
    nationalId: null,
    type: ClientType.BUYER,
    source: ClientSource.WEBSITE,
    notes: null,
    assignedAgentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a client successfully', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue(sampleClient);

      const result = await service.create({
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+201234567890',
        type: ClientType.BUYER,
        source: ClientSource.WEBSITE,
      });

      expect(result).toEqual(sampleClient);
      expect(mockPrisma.client.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException on duplicate email', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        ...sampleClient,
        email: 'ahmed@example.com',
      });

      await expect(
        service.create({
          firstName: 'Test',
          lastName: 'User',
          email: 'ahmed@example.com',
          phone: '+201111111111',
          type: ClientType.BUYER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate phone', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        ...sampleClient,
        phone: '+201234567890',
        email: 'other@example.com',
      });

      await expect(
        service.create({
          firstName: 'Test',
          lastName: 'User',
          phone: '+201234567890',
          type: ClientType.BUYER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const clients = [{ ...sampleClient, _count: { leads: 2, contracts: 1 } }];
      mockPrisma.client.findMany.mockResolvedValue(clients);
      mockPrisma.client.count.mockResolvedValue(1);

      const result = await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        undefined,
        true,
      );

      expect(result.data).toEqual(clients);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should scope to agent when not admin/manager', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        'agent-123',
        false,
      );

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedAgentId: 'agent-123' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a client with relations', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sampleClient);

      const result = await service.findOne(sampleClient.id);
      expect(result).toEqual(sampleClient);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sampleClient);
      mockPrisma.client.findFirst.mockResolvedValue(null);
      const updated = { ...sampleClient, firstName: 'Mohamed' };
      mockPrisma.client.update.mockResolvedValue(updated);

      const result = await service.update(sampleClient.id, {
        firstName: 'Mohamed',
      });

      expect(result.firstName).toBe('Mohamed');
    });

    it('should throw NotFoundException on update of nonexistent client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sampleClient);
      mockPrisma.client.delete.mockResolvedValue(sampleClient);

      const result = await service.remove(sampleClient.id);
      expect(result).toEqual(sampleClient);
    });
  });

  describe('assignAgent', () => {
    it('should assign an agent to a client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sampleClient);
      const assigned = { ...sampleClient, assignedAgentId: 'agent-456' };
      mockPrisma.client.update.mockResolvedValue(assigned);

      const result = await service.assignAgent(sampleClient.id, 'agent-456');
      expect(result.assignedAgentId).toBe('agent-456');
    });
  });

  describe('getStats', () => {
    it('should return aggregated statistics', async () => {
      mockPrisma.client.count.mockResolvedValue(50);
      mockPrisma.client.groupBy
        .mockResolvedValueOnce([{ type: ClientType.BUYER, _count: 30 }])
        .mockResolvedValueOnce([{ source: ClientSource.WEBSITE, _count: 20 }]);

      const stats = await service.getStats(undefined, true);

      expect(stats.total).toBe(50);
      expect(stats.byType).toHaveLength(1);
      expect(stats.bySource).toHaveLength(1);
    });
  });
});
