import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceStatus, LeadStatus, PropertyStatus } from '@prisma/client';

const mockPrisma = {
  invoice: { findMany: jest.fn() },
  lead: { findMany: jest.fn() },
  property: { findMany: jest.fn() },
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('getDateRange', () => {
    it('defaults to this month', () => {
      const { start, end } = service['getDateRange']();
      expect(start.getDate()).toBe(1);
      expect(end).toBeInstanceOf(Date);
    });

    it('handles today range', () => {
      const { start, end } = service['getDateRange']('today');
      expect(start.getHours()).toBe(0);
    });

    it('handles last_month range', () => {
      const { start, end } = service['getDateRange']('last_month');
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(0);
    });

    it('handles custom range', () => {
      const { start, end } = service['getDateRange']('custom', '2026-01-01', '2026-01-31');
      expect(start.toISOString()).toContain('2026-01-01');
      expect(end.toISOString()).toContain('2026-01-31');
    });
  });

  describe('formatPeriodKey', () => {
    it('formats as month', () => {
      const d = new Date('2026-05-15');
      expect(service['formatPeriodKey'](d, 'month')).toBe('2026-05');
    });

    it('formats as day', () => {
      const d = new Date('2026-05-15');
      expect(service['formatPeriodKey'](d, 'day')).toBe('2026-05-15');
    });
  });

  describe('getRevenue', () => {
    it('returns revenue data grouped by period', async () => {
      const now = new Date();
      mockPrisma.invoice.findMany.mockResolvedValue([
        { amount: 100_000, paidDate: now },
        { amount: 200_000, paidDate: now },
      ]);

      const result = await service.getRevenue({ range: 'this_month' });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(300_000);
      expect(result.data[0].contracts).toBe(2);
    });

    it('returns empty when no invoices', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const result = await service.getRevenue({});

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getLeadConversion', () => {
    it('calculates conversion rates by source', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { source: 'REFERRAL', status: LeadStatus.WON },
        { source: 'REFERRAL', status: LeadStatus.WON },
        { source: 'WEBSITE', status: LeadStatus.LOST },
        { source: 'WEBSITE', status: LeadStatus.LOST },
        { source: 'WEBSITE', status: LeadStatus.NEW },
      ]);

      const result = await service.getLeadConversion({});

      const referral = result.bySource.find((s) => s.source === 'REFERRAL');
      const website = result.bySource.find((s) => s.source === 'WEBSITE');

      expect(referral?.total).toBe(2);
      expect(referral?.converted).toBe(2);
      expect(referral?.conversionRate).toBe(100);
      expect(website?.total).toBe(3);
      expect(website?.converted).toBe(0);
    });
  });

  describe('getProperties', () => {
    it('groups properties by type with stats', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        { type: 'APARTMENT', status: PropertyStatus.AVAILABLE, price: 1_000_000 },
        { type: 'APARTMENT', status: PropertyStatus.SOLD, price: 1_500_000 },
        { type: 'VILLA', status: PropertyStatus.AVAILABLE, price: 5_000_000 },
      ]);

      const result = await service.getProperties();

      const apartment = result.byType.find((t) => t.type === 'APARTMENT');
      const villa = result.byType.find((t) => t.type === 'VILLA');

      expect(apartment?.total).toBe(2);
      expect(apartment?.available).toBe(1);
      expect(apartment?.sold).toBe(1);
      expect(villa?.total).toBe(1);
      expect(result.totals.total).toBe(3);
    });
  });
});