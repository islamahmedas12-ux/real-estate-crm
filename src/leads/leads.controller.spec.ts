import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { LeadStatus, LeadPriority, LeadActivityType, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  changeStatus: jest.fn(),
  assignAgent: jest.fn(),
  addActivity: jest.fn(),
  getActivities: jest.fn(),
  getPipeline: jest.fn(),
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

const managerUser: AuthenticatedUser = {
  id: 'user-003',
  authmeId: 'manager-001',
  sub: 'manager-001',
  email: 'manager@test.com',
  firstName: 'Manager',
  lastName: 'User',
  role: UserRole.MANAGER,
  roles: ['manager'],
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

const sampleLead = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  clientId: '223e4567-e89b-12d3-a456-426614174001',
  propertyId: '323e4567-e89b-12d3-a456-426614174002',
  status: LeadStatus.NEW,
  priority: LeadPriority.MEDIUM,
  source: 'Website',
  budget: 500000,
  notes: null,
  assignedAgentId: 'agent-001',
  nextFollowUp: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('LeadsController', () => {
  let controller: LeadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [{ provide: LeadsService, useValue: mockService }],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a lead and pass user.sub as performedBy', async () => {
      mockService.create.mockResolvedValue(sampleLead);

      const dto = {
        clientId: sampleLead.clientId,
        propertyId: sampleLead.propertyId,
        source: 'Website',
        budget: 500000,
      };

      const result = await controller.create(dto as any, adminUser);

      expect(result).toEqual(sampleLead);
      expect(mockService.create).toHaveBeenCalledWith(dto, adminUser.sub);
    });
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    const paginated = {
      data: [sampleLead],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should return paginated leads for admin', async () => {
      mockService.findAll.mockResolvedValue(paginated);

      const filter = {} as any;
      const result = await controller.findAll(filter, adminUser);

      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith(filter, adminUser.sub, true);
    });

    it('should return paginated leads for manager', async () => {
      mockService.findAll.mockResolvedValue(paginated);

      const filter = {} as any;
      const result = await controller.findAll(filter, managerUser);

      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith(filter, managerUser.sub, true);
    });

    it('should scope results for agent users (not admin/manager)', async () => {
      const emptyPaginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(emptyPaginated);

      await controller.findAll({} as any, agentUser);

      expect(mockService.findAll).toHaveBeenCalledWith({}, agentUser.sub, false);
    });

    it('should pass filter through to service', async () => {
      mockService.findAll.mockResolvedValue(paginated);

      const filter = {
        status: LeadStatus.QUALIFIED,
        priority: LeadPriority.HIGH,
        page: 2,
        limit: 10,
      } as any;

      await controller.findAll(filter, adminUser);

      expect(mockService.findAll).toHaveBeenCalledWith(filter, adminUser.sub, true);
    });
  });

  // ─── getPipeline ──────────────────────────────────────────────────────────

  describe('getPipeline', () => {
    const pipelineResult = {
      [LeadStatus.NEW]: [{ id: '1' }],
      [LeadStatus.CONTACTED]: [],
      [LeadStatus.QUALIFIED]: [],
      [LeadStatus.PROPOSAL]: [],
      [LeadStatus.NEGOTIATION]: [],
      [LeadStatus.WON]: [],
      [LeadStatus.LOST]: [],
    };

    it('should return pipeline for admin with isAdminOrManager=true', async () => {
      mockService.getPipeline.mockResolvedValue(pipelineResult);

      const result = await controller.getPipeline(adminUser);

      expect(result).toEqual(pipelineResult);
      expect(mockService.getPipeline).toHaveBeenCalledWith(adminUser.sub, true);
    });

    it('should return pipeline for manager with isAdminOrManager=true', async () => {
      mockService.getPipeline.mockResolvedValue(pipelineResult);

      const result = await controller.getPipeline(managerUser);

      expect(result).toEqual(pipelineResult);
      expect(mockService.getPipeline).toHaveBeenCalledWith(managerUser.sub, true);
    });

    it('should return pipeline for agent with isAdminOrManager=false', async () => {
      mockService.getPipeline.mockResolvedValue(pipelineResult);

      await controller.getPipeline(agentUser);

      expect(mockService.getPipeline).toHaveBeenCalledWith(agentUser.sub, false);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    const stats = {
      total: 100,
      byStatus: [{ status: LeadStatus.NEW, count: 40 }],
      byPriority: [{ priority: LeadPriority.HIGH, count: 25 }],
      bySource: [{ source: 'Website', count: 60 }],
    };

    it('should return statistics for admin', async () => {
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(adminUser);

      expect(result.total).toBe(100);
      expect(mockService.getStats).toHaveBeenCalledWith(adminUser.sub, true);
    });

    it('should scope stats for agent users', async () => {
      mockService.getStats.mockResolvedValue({
        total: 5,
        byStatus: [],
        byPriority: [],
        bySource: [],
      });

      await controller.getStats(agentUser);

      expect(mockService.getStats).toHaveBeenCalledWith(agentUser.sub, false);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single lead with relations', async () => {
      const leadWithRelations = {
        ...sampleLead,
        client: { id: sampleLead.clientId, firstName: 'Ahmed', lastName: 'Hassan' },
        property: { id: sampleLead.propertyId, title: 'Villa' },
        activities: [],
        _count: { activities: 0 },
      };
      mockService.findOne.mockResolvedValue(leadWithRelations);

      const result = await controller.findOne(sampleLead.id);

      expect(result.id).toBe(sampleLead.id);
      expect(result.client).toBeDefined();
      expect(result.property).toBeDefined();
      expect(mockService.findOne).toHaveBeenCalledWith(sampleLead.id);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a lead', async () => {
      const updated = { ...sampleLead, notes: 'Updated notes', budget: 750000 };
      mockService.update.mockResolvedValue(updated);

      const dto = { notes: 'Updated notes', budget: 750000 };
      const result = await controller.update(sampleLead.id, dto);

      expect(result.notes).toBe('Updated notes');
      expect(result.budget).toBe(750000);
      expect(mockService.update).toHaveBeenCalledWith(sampleLead.id, dto);
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a lead (mark as LOST)', async () => {
      const removed = { ...sampleLead, status: LeadStatus.LOST };
      mockService.remove.mockResolvedValue(removed);

      const result = await controller.remove(sampleLead.id);

      expect(result.status).toBe(LeadStatus.LOST);
      expect(mockService.remove).toHaveBeenCalledWith(sampleLead.id);
    });
  });

  // ─── changeStatus ─────────────────────────────────────────────────────────

  describe('changeStatus', () => {
    it('should change lead status', async () => {
      const updated = { ...sampleLead, status: LeadStatus.CONTACTED };
      mockService.changeStatus.mockResolvedValue(updated);

      const dto = { status: LeadStatus.CONTACTED };
      const result = await controller.changeStatus(sampleLead.id, dto, adminUser);

      expect(result.status).toBe(LeadStatus.CONTACTED);
      expect(mockService.changeStatus).toHaveBeenCalledWith(sampleLead.id, dto, adminUser.sub);
    });

    it('should pass notes through when provided', async () => {
      const updated = { ...sampleLead, status: LeadStatus.CONTACTED };
      mockService.changeStatus.mockResolvedValue(updated);

      const dto = { status: LeadStatus.CONTACTED, notes: 'Spoke on phone' };
      await controller.changeStatus(sampleLead.id, dto, agentUser);

      expect(mockService.changeStatus).toHaveBeenCalledWith(sampleLead.id, dto, agentUser.sub);
    });

    it('should propagate service errors', async () => {
      mockService.changeStatus.mockRejectedValue(new Error('Cannot transition'));

      await expect(
        controller.changeStatus(sampleLead.id, { status: LeadStatus.WON }, adminUser),
      ).rejects.toThrow('Cannot transition');
    });
  });

  // ─── assignAgent ──────────────────────────────────────────────────────────

  describe('assignAgent', () => {
    it('should assign an agent to a lead', async () => {
      const assigned = { ...sampleLead, assignedAgentId: 'agent-456' };
      mockService.assignAgent.mockResolvedValue(assigned);

      const agentId = '123e4567-e89b-12d3-a456-426614174099';
      const result = await controller.assignAgent(sampleLead.id, { agentId });

      expect(result.assignedAgentId).toBe('agent-456');
      expect(mockService.assignAgent).toHaveBeenCalledWith(sampleLead.id, agentId);
    });
  });

  // ─── addActivity ──────────────────────────────────────────────────────────

  describe('addActivity', () => {
    it('should add an activity to a lead', async () => {
      const activity = {
        id: 'activity-001',
        leadId: sampleLead.id,
        type: LeadActivityType.CALL,
        description: 'Called client',
        performedBy: agentUser.sub,
        createdAt: new Date(),
      };
      mockService.addActivity.mockResolvedValue(activity);

      const dto = { type: LeadActivityType.CALL, description: 'Called client' };
      const result = await controller.addActivity(sampleLead.id, dto, agentUser);

      expect(result).toEqual(activity);
      expect(mockService.addActivity).toHaveBeenCalledWith(sampleLead.id, dto, agentUser.sub);
    });
  });

  // ─── getActivities ────────────────────────────────────────────────────────

  describe('getActivities', () => {
    it('should return paginated activities with default page and limit', async () => {
      const paginatedActivities = {
        data: [
          {
            id: 'act-1',
            leadId: sampleLead.id,
            type: LeadActivityType.CALL,
            description: 'Called',
            performedBy: 'user-1',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockService.getActivities.mockResolvedValue(paginatedActivities);

      const result = await controller.getActivities(sampleLead.id);

      expect(result).toEqual(paginatedActivities);
      expect(mockService.getActivities).toHaveBeenCalledWith(sampleLead.id, 1, 20);
    });

    it('should pass custom page and limit', async () => {
      const paginatedActivities = { data: [], total: 50, page: 3, limit: 10, totalPages: 5 };
      mockService.getActivities.mockResolvedValue(paginatedActivities);

      const result = await controller.getActivities(sampleLead.id, 3, 10);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(mockService.getActivities).toHaveBeenCalledWith(sampleLead.id, 3, 10);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.getActivities.mockRejectedValue(new Error('Lead not found'));

      await expect(controller.getActivities('nonexistent')).rejects.toThrow('Lead not found');
    });
  });
});
