import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { DateRangePreset } from './dto/date-range.dto.js';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockService = {
  getAdminOverview: jest.fn(),
  getAdminRevenue: jest.fn(),
  getAdminLeads: jest.fn(),
  getAdminProperties: jest.fn(),
  getAdminAgents: jest.fn(),
  getAdminRecent: jest.fn(),
  getAgentOverview: jest.fn(),
  getAgentLeads: jest.fn(),
  getAgentFollowUps: jest.fn(),
  getAgentPerformance: jest.fn(),
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

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── Admin Endpoints ────────────────────────────────────────────────

  describe('getAdminOverview', () => {
    it('should return overview statistics', async () => {
      const overview = {
        totals: { properties: 50, clients: 100, leads: 200, contracts: 30, revenue: 5000000 },
        period: {
          newProperties: 5,
          newClients: 10,
          newLeads: 20,
          start: new Date(),
          end: new Date(),
        },
      };
      mockService.getAdminOverview.mockResolvedValue(overview);

      const dateRange = { range: DateRangePreset.THIS_MONTH };
      const result = await controller.getAdminOverview(dateRange);
      expect(result.totals.properties).toBe(50);
      expect(mockService.getAdminOverview).toHaveBeenCalledWith(dateRange);
    });
  });

  describe('getAdminRevenue', () => {
    it('should return revenue timeline with comparison', async () => {
      const revenue = {
        timeline: [{ date: '2026-03-01', amount: 100000 }],
        total: 500000,
        previousPeriodTotal: 400000,
        changePercent: 25,
        period: { start: new Date(), end: new Date() },
      };
      mockService.getAdminRevenue.mockResolvedValue(revenue);

      const dateRange = { range: DateRangePreset.THIS_MONTH };
      const result = await controller.getAdminRevenue(dateRange);
      expect(result.total).toBe(500000);
      expect(result.changePercent).toBe(25);
      expect(mockService.getAdminRevenue).toHaveBeenCalledWith(dateRange);
    });
  });

  describe('getAdminLeads', () => {
    it('should return lead pipeline summary', async () => {
      const leads = {
        pipeline: [
          { status: 'NEW', count: 10 },
          { status: 'WON', count: 5 },
        ],
        byPriority: [{ priority: 'HIGH', count: 3 }],
        newLeadsInPeriod: 10,
        wonLeadsInPeriod: 5,
        conversionRate: 8.33,
      };
      mockService.getAdminLeads.mockResolvedValue(leads);

      const result = await controller.getAdminLeads({ range: DateRangePreset.THIS_MONTH });
      expect(result.pipeline).toHaveLength(2);
      expect(result.conversionRate).toBe(8.33);
    });
  });

  describe('getAdminProperties', () => {
    it('should return property breakdowns', async () => {
      const properties = {
        byStatus: [{ status: 'AVAILABLE', count: 30 }],
        byType: [{ type: 'APARTMENT', count: 20 }],
        total: 50,
      };
      mockService.getAdminProperties.mockResolvedValue(properties);

      const result = await controller.getAdminProperties();
      expect(result.total).toBe(50);
      expect(mockService.getAdminProperties).toHaveBeenCalled();
    });
  });

  describe('getAdminAgents', () => {
    it('should return agent performance data', async () => {
      const agents = {
        agents: [{ agentId: 'agent-001', leadsWon: 5, totalLeads: 20, revenue: 1000000 }],
        period: { start: new Date(), end: new Date() },
      };
      mockService.getAdminAgents.mockResolvedValue(agents);

      const result = await controller.getAdminAgents({ range: DateRangePreset.THIS_MONTH });
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].leadsWon).toBe(5);
    });
  });

  describe('getAdminRecent', () => {
    it('should return recent activities', async () => {
      const activities = [
        {
          id: 'act-001',
          type: 'CREATED',
          description: 'New property added',
          createdAt: new Date(),
        },
      ];
      mockService.getAdminRecent.mockResolvedValue(activities);

      const result = await controller.getAdminRecent();
      expect(result).toHaveLength(1);
      expect(mockService.getAdminRecent).toHaveBeenCalled();
    });
  });

  // ─── Agent Endpoints ────────────────────────────────────────────────

  describe('getAgentOverview', () => {
    it('should return overview scoped to agent', async () => {
      const overview = { properties: 5, clients: 10, leads: 15, upcomingFollowUps: 3 };
      mockService.getAgentOverview.mockResolvedValue(overview);

      const result = await controller.getAgentOverview(agentUser);
      expect(result.properties).toBe(5);
      expect(mockService.getAgentOverview).toHaveBeenCalledWith('agent-001');
    });
  });

  describe('getAgentLeads', () => {
    it('should return agent lead pipeline', async () => {
      const leads = {
        pipeline: [{ status: 'NEW', count: 3 }],
        total: 10,
      };
      mockService.getAgentLeads.mockResolvedValue(leads);

      const result = await controller.getAgentLeads(agentUser);
      expect(result.total).toBe(10);
      expect(mockService.getAgentLeads).toHaveBeenCalledWith('agent-001');
    });
  });

  describe('getAgentFollowUps', () => {
    it('should return overdue and upcoming follow-ups', async () => {
      const followUps = {
        overdue: [{ id: 'lead-001', nextFollowUp: new Date() }],
        upcoming: [{ id: 'lead-002', nextFollowUp: new Date() }],
      };
      mockService.getAgentFollowUps.mockResolvedValue(followUps);

      const result = await controller.getAgentFollowUps(agentUser);
      expect(result.overdue).toHaveLength(1);
      expect(result.upcoming).toHaveLength(1);
      expect(mockService.getAgentFollowUps).toHaveBeenCalledWith('agent-001');
    });
  });

  describe('getAgentPerformance', () => {
    it('should return this month vs last month comparison', async () => {
      const performance = {
        thisMonth: { leads: 10, won: 3, revenue: 500000 },
        lastMonth: { leads: 8, won: 2, revenue: 400000 },
        change: { leads: 25, won: 50, revenue: 25 },
      };
      mockService.getAgentPerformance.mockResolvedValue(performance);

      const result = await controller.getAgentPerformance(agentUser);
      expect(result.thisMonth.leads).toBe(10);
      expect(result.change.leads).toBe(25);
      expect(mockService.getAgentPerformance).toHaveBeenCalledWith('agent-001');
    });
  });
});
