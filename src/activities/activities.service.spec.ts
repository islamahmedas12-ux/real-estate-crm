import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityEntityType } from '@prisma/client';

const mockPrisma = {
  activity: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivitiesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  const sampleActivity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'CREATE',
    description: 'Created property 123',
    entityType: ActivityEntityType.PROPERTY,
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    performedBy: '550e8400-e29b-41d4-a716-446655440002',
    metadata: { created: true },
    createdAt: new Date('2026-03-20T10:00:00Z'),
  };

  describe('log', () => {
    it('should create a new activity record', async () => {
      mockPrisma.activity.create.mockResolvedValue(sampleActivity);

      const dto = {
        type: 'CREATE',
        description: 'Created property 123',
        entityType: ActivityEntityType.PROPERTY,
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        performedBy: '550e8400-e29b-41d4-a716-446655440002',
        metadata: { created: true },
      };

      const result = await service.log(dto);

      expect(result).toEqual(sampleActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should create an activity without optional metadata', async () => {
      const activityNoMeta = { ...sampleActivity, metadata: undefined };
      mockPrisma.activity.create.mockResolvedValue(activityNoMeta);

      const dto = {
        type: 'UPDATE',
        description: 'Updated client info',
        entityType: ActivityEntityType.CLIENT,
        entityId: 'entity-001',
        performedBy: 'user-001',
      };

      const result = await service.log(dto);

      expect(result).toEqual(activityNoMeta);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should propagate errors from prisma', async () => {
      mockPrisma.activity.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.log({
          type: 'CREATE',
          description: 'test',
          entityType: ActivityEntityType.PROPERTY,
          entityId: 'id',
          performedBy: 'user',
        }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    const makeFilter = (overrides = {}) => ({
      page: 1,
      limit: 20,
      get skip() {
        return ((this.page ?? 1) - 1) * (this.limit ?? 20);
      },
      ...overrides,
    });

    it('should return paginated results with no filters', async () => {
      const activities = [sampleActivity];
      mockPrisma.activity.findMany.mockResolvedValue(activities);
      mockPrisma.activity.count.mockResolvedValue(1);

      const filter = makeFilter();
      const result = await service.findAll(filter as any);

      expect(result.data).toEqual(activities);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by activity type', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ type: 'CREATE' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CREATE' }),
        }),
      );
    });

    it('should filter by entityType', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ entityType: ActivityEntityType.PROPERTY });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: ActivityEntityType.PROPERTY }),
        }),
      );
    });

    it('should filter by entityId', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ entityId: 'entity-123' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'entity-123' }),
        }),
      );
    });

    it('should filter by performedBy', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ performedBy: 'user-abc' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ performedBy: 'user-abc' }),
        }),
      );
    });

    it('should filter by search term in description', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ search: 'property' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: 'property', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by date range (from and to)', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ from: '2026-01-01', to: '2026-12-31' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-12-31'),
            },
          }),
        }),
      );
    });

    it('should filter by from date only', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ from: '2026-06-01' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date('2026-06-01') },
          }),
        }),
      );
    });

    it('should filter by to date only', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({ to: '2026-06-30' });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { lte: new Date('2026-06-30') },
          }),
        }),
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const filter = makeFilter({
        type: 'UPDATE',
        entityType: ActivityEntityType.CLIENT,
        performedBy: 'user-x',
        from: '2026-01-01',
      });
      await service.findAll(filter as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'UPDATE',
            entityType: ActivityEntityType.CLIENT,
            performedBy: 'user-x',
            createdAt: { gte: new Date('2026-01-01') },
          }),
        }),
      );
    });

    it('should handle pagination for page 2', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(25);

      const filter = makeFilter({ page: 2, limit: 10 });
      const result = await service.findAll(filter as any);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findByEntity', () => {
    const makeFilter = (overrides = {}) => ({
      page: 1,
      limit: 20,
      get skip() {
        return ((this.page ?? 1) - 1) * (this.limit ?? 20);
      },
      ...overrides,
    });

    it('should return activities for a specific entity', async () => {
      const activities = [sampleActivity];
      mockPrisma.activity.findMany.mockResolvedValue(activities);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.findByEntity(
        ActivityEntityType.PROPERTY,
        'entity-123',
        makeFilter() as any,
      );

      expect(result.data).toEqual(activities);
      expect(result.total).toBe(1);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: ActivityEntityType.PROPERTY,
            entityId: 'entity-123',
          }),
        }),
      );
    });

    it('should apply date filters to entity query', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.findByEntity(
        ActivityEntityType.CLIENT,
        'client-456',
        makeFilter({ from: '2026-03-01', to: '2026-03-31' }) as any,
      );

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: ActivityEntityType.CLIENT,
            entityId: 'client-456',
            createdAt: {
              gte: new Date('2026-03-01'),
              lte: new Date('2026-03-31'),
            },
          }),
        }),
      );
    });

    it('should return empty paginated result when no activities found', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const result = await service.findByEntity(
        ActivityEntityType.LEAD,
        'nonexistent',
        makeFilter() as any,
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findByUser', () => {
    const makeFilter = (overrides = {}) => ({
      page: 1,
      limit: 20,
      get skip() {
        return ((this.page ?? 1) - 1) * (this.limit ?? 20);
      },
      ...overrides,
    });

    it('should return activities for a specific user', async () => {
      const activities = [sampleActivity];
      mockPrisma.activity.findMany.mockResolvedValue(activities);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.findByUser('user-001', makeFilter() as any);

      expect(result.data).toEqual(activities);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ performedBy: 'user-001' }),
        }),
      );
    });

    it('should apply date filters to user query', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.findByUser('user-001', makeFilter({ from: '2026-01-01' }) as any);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedBy: 'user-001',
            createdAt: { gte: new Date('2026-01-01') },
          }),
        }),
      );
    });

    it('should paginate user activities correctly', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(50);

      const result = await service.findByUser(
        'user-001',
        makeFilter({ page: 3, limit: 10 }) as any,
      );

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findRecent', () => {
    it('should return recent activities with default limit', async () => {
      const activities = [sampleActivity];
      mockPrisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.findRecent();

      expect(result).toEqual(activities);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should accept a custom limit', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);

      await service.findRecent(5);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });

    it('should return empty array when no activities exist', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);

      const result = await service.findRecent();

      expect(result).toEqual([]);
    });
  });

  describe('purgeOlderThan', () => {
    it('should delete activities older than the given number of days', async () => {
      mockPrisma.activity.deleteMany.mockResolvedValue({ count: 15 });

      const result = await service.purgeOlderThan(90);

      expect(result.deleted).toBe(15);
      expect(result.before).toBeDefined();
      expect(mockPrisma.activity.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should compute cutoff date correctly', async () => {
      mockPrisma.activity.deleteMany.mockResolvedValue({ count: 0 });

      const beforeCall = new Date();
      const result = await service.purgeOlderThan(30);
      const afterCall = new Date();

      const cutoff = new Date(result.before);
      const expectedLow = new Date(beforeCall);
      expectedLow.setDate(expectedLow.getDate() - 30);
      const expectedHigh = new Date(afterCall);
      expectedHigh.setDate(expectedHigh.getDate() - 30);

      expect(cutoff.getTime()).toBeGreaterThanOrEqual(expectedLow.getTime() - 1000);
      expect(cutoff.getTime()).toBeLessThanOrEqual(expectedHigh.getTime() + 1000);
    });

    it('should return zero deleted when no old activities exist', async () => {
      mockPrisma.activity.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.purgeOlderThan(365);

      expect(result.deleted).toBe(0);
    });

    it('should propagate database errors', async () => {
      mockPrisma.activity.deleteMany.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.purgeOlderThan(30)).rejects.toThrow('DB connection lost');
    });
  });
});
