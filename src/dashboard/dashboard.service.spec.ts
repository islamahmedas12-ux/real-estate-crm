import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DateRangePreset } from './dto/date-range.dto.js';

const mockPrisma = {
  property: { count: jest.fn(), groupBy: jest.fn() },
  client: { count: jest.fn() },
  lead: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
  contract: { count: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  invoice: { aggregate: jest.fn(), findMany: jest.fn() },
  activity: { findMany: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminOverview', () => {
    it('should return totals and period counts', async () => {
      mockPrisma.property.count.mockResolvedValueOnce(50).mockResolvedValueOnce(5);
      mockPrisma.client.count.mockResolvedValueOnce(100).mockResolvedValueOnce(10);
      mockPrisma.lead.count.mockResolvedValueOnce(200).mockResolvedValueOnce(20);
      mockPrisma.contract.count.mockResolvedValue(30);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 5000000 } });

      const result = await service.getAdminOverview({ range: DateRangePreset.THIS_MONTH });

      expect(result.totals.properties).toBe(50);
      expect(result.totals.clients).toBe(100);
      expect(result.totals.revenue).toBe(5000000);
      expect(result.period.newProperties).toBe(5);
    });
  });

  describe('getAdminProperties', () => {
    it('should return breakdowns by status and type', async () => {
      mockPrisma.property.groupBy
        .mockResolvedValueOnce([{ status: 'AVAILABLE', _count: 30 }])
        .mockResolvedValueOnce([{ type: 'APARTMENT', _count: 20 }]);

      const result = await service.getAdminProperties();

      expect(result.byStatus).toHaveLength(1);
      expect(result.byType).toHaveLength(1);
      expect(result.total).toBe(30);
    });
  });

  describe('getAdminRecent', () => {
    it('should return recent activities', async () => {
      const activities = [{ id: 'act-1', type: 'CREATED', createdAt: new Date() }];
      mockPrisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.getAdminRecent(10);

      expect(result).toHaveLength(1);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('getAgentOverview', () => {
    it('should return counts scoped to agent', async () => {
      mockPrisma.property.count.mockResolvedValue(5);
      mockPrisma.client.count.mockResolvedValue(10);
      mockPrisma.lead.count.mockResolvedValueOnce(15).mockResolvedValueOnce(3);

      const result = await service.getAgentOverview('agent-001');

      expect(result.properties).toBe(5);
      expect(result.clients).toBe(10);
      expect(result.leads).toBe(15);
      expect(result.upcomingFollowUps).toBe(3);
    });
  });

  describe('getAgentLeads', () => {
    it('should return pipeline grouped by status', async () => {
      mockPrisma.lead.groupBy.mockResolvedValue([
        { status: 'NEW', _count: 3 },
        { status: 'CONTACTED', _count: 2 },
      ]);

      const result = await service.getAgentLeads('agent-001');

      expect(result.pipeline).toHaveLength(2);
      expect(result.total).toBe(5);
    });
  });

  describe('getAgentFollowUps', () => {
    it('should return overdue and upcoming follow-ups', async () => {
      mockPrisma.lead.findMany
        .mockResolvedValueOnce([{ id: 'lead-1' }])
        .mockResolvedValueOnce([{ id: 'lead-2' }, { id: 'lead-3' }]);

      const result = await service.getAgentFollowUps('agent-001');

      expect(result.overdue).toHaveLength(1);
      expect(result.upcoming).toHaveLength(2);
    });
  });

  describe('getAgentPerformance', () => {
    it('should compare this month vs last month', async () => {
      mockPrisma.lead.count
        .mockResolvedValueOnce(10)  // this month leads
        .mockResolvedValueOnce(8)   // last month leads
        .mockResolvedValueOnce(3)   // this month won
        .mockResolvedValueOnce(2);  // last month won
      mockPrisma.contract.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 500000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 400000 } });

      const result = await service.getAgentPerformance('agent-001');

      expect(result.thisMonth.leads).toBe(10);
      expect(result.lastMonth.leads).toBe(8);
      expect(result.change.leads).toBe(25);
      expect(result.change.revenue).toBe(25);
    });
  });
});
