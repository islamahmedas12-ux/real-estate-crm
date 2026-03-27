import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { ClientType, ClientSource, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignAgent: jest.fn(),
  getHistory: jest.fn(),
  getStats: jest.fn(),
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

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockService }],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a client', async () => {
      mockService.create.mockResolvedValue(sampleClient);

      const dto = {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+201234567890',
        type: ClientType.BUYER,
        source: ClientSource.WEBSITE,
      };

      const result = await controller.create(dto as any);
      expect(result).toEqual(sampleClient);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated clients for admin', async () => {
      const paginated = { data: [sampleClient], total: 1, page: 1, limit: 20, totalPages: 1 };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({} as any, adminUser);
      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith({}, adminUser.sub, true);
    });

    it('should scope results for non-admin users', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(paginated);

      await controller.findAll({} as any, agentUser);
      expect(mockService.findAll).toHaveBeenCalledWith({}, agentUser.sub, false);
    });
  });

  describe('getStats', () => {
    it('should return statistics for admin', async () => {
      const stats = {
        total: 100,
        byType: [{ type: ClientType.BUYER, count: 60 }],
        bySource: [{ source: ClientSource.WEBSITE, count: 40 }],
      };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(adminUser);
      expect(result.total).toBe(100);
      expect(mockService.getStats).toHaveBeenCalledWith(adminUser.sub, true);
    });

    it('should scope stats for agent users', async () => {
      mockService.getStats.mockResolvedValue({ total: 5, byType: [], bySource: [] });

      await controller.getStats(agentUser);
      expect(mockService.getStats).toHaveBeenCalledWith(agentUser.sub, false);
    });
  });

  describe('findOne', () => {
    it('should return a single client with relations', async () => {
      const clientWithRelations = {
        ...sampleClient,
        leads: [],
        contracts: [],
        _count: { leads: 0, contracts: 0 },
      };
      mockService.findOne.mockResolvedValue(clientWithRelations);

      const result = await controller.findOne(sampleClient.id);
      expect(result.id).toBe(sampleClient.id);
      expect(mockService.findOne).toHaveBeenCalledWith(sampleClient.id);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updated = { ...sampleClient, firstName: 'Mohamed' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(sampleClient.id, { firstName: 'Mohamed' });
      expect(result.firstName).toBe('Mohamed');
      expect(mockService.update).toHaveBeenCalledWith(sampleClient.id, { firstName: 'Mohamed' });
    });
  });

  describe('remove', () => {
    it('should delete a client (admin only)', async () => {
      mockService.remove.mockResolvedValue(sampleClient);

      const result = await controller.remove(sampleClient.id);
      expect(result).toEqual(sampleClient);
      expect(mockService.remove).toHaveBeenCalledWith(sampleClient.id);
    });
  });

  describe('assignAgent', () => {
    it('should assign an agent to a client', async () => {
      const assigned = { ...sampleClient, assignedAgentId: 'agent-456' };
      mockService.assignAgent.mockResolvedValue(assigned);

      const agentId = '123e4567-e89b-12d3-a456-426614174001';
      const result = await controller.assignAgent(sampleClient.id, { agentId });
      expect(result.assignedAgentId).toBe('agent-456');
      expect(mockService.assignAgent).toHaveBeenCalledWith(sampleClient.id, agentId);
    });
  });

  describe('getHistory', () => {
    it('should return interaction history for a client', async () => {
      const history = {
        leads: [{ id: 'lead-001', status: 'NEW' }],
        contracts: [{ id: 'contract-001', status: 'ACTIVE' }],
      };
      mockService.getHistory.mockResolvedValue(history);

      const result = await controller.getHistory(sampleClient.id);
      expect(result.leads).toHaveLength(1);
      expect(result.contracts).toHaveLength(1);
      expect(mockService.getHistory).toHaveBeenCalledWith(sampleClient.id);
    });
  });
});
