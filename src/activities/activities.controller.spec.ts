import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller.js';
import { ActivitiesService } from './activities.service.js';
import { ActivityEntityType } from '@prisma/client';

const mockService = {
  log: jest.fn(),
  findAll: jest.fn(),
  findByEntity: jest.fn(),
  findByUser: jest.fn(),
  findRecent: jest.fn(),
  purgeOlderThan: jest.fn(),
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [{ provide: ActivitiesService, useValue: mockService }],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
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

  const paginatedResult = {
    data: [sampleActivity],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated activities', async () => {
      mockService.findAll.mockResolvedValue(paginatedResult);

      const filter = { page: 1, limit: 20 };
      const result = await controller.findAll(filter as any);

      expect(result).toEqual(paginatedResult);
      expect(mockService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should pass through all filter parameters', async () => {
      mockService.findAll.mockResolvedValue({ ...paginatedResult, data: [] });

      const filter = {
        page: 1,
        limit: 10,
        type: 'UPDATE',
        entityType: ActivityEntityType.CLIENT,
        performedBy: 'user-001',
        from: '2026-01-01',
        to: '2026-12-31',
        search: 'property',
      };

      await controller.findAll(filter as any);
      expect(mockService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should return empty result when no activities match', async () => {
      const emptyResult = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(emptyResult);

      const result = await controller.findAll({} as any);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findRecent', () => {
    it('should return recent activities with default limit', async () => {
      const activities = [sampleActivity];
      mockService.findRecent.mockResolvedValue(activities);

      const result = await controller.findRecent(undefined);

      expect(result).toEqual(activities);
      expect(mockService.findRecent).toHaveBeenCalledWith(20);
    });

    it('should accept a custom limit', async () => {
      mockService.findRecent.mockResolvedValue([sampleActivity]);

      const result = await controller.findRecent(5);

      expect(result).toEqual([sampleActivity]);
      expect(mockService.findRecent).toHaveBeenCalledWith(5);
    });

    it('should return empty array when no recent activities', async () => {
      mockService.findRecent.mockResolvedValue([]);

      const result = await controller.findRecent(undefined);

      expect(result).toEqual([]);
    });
  });

  describe('findByEntity', () => {
    it('should return activities for a specific entity', async () => {
      mockService.findByEntity.mockResolvedValue(paginatedResult);

      const filter = { page: 1, limit: 20 };
      const result = await controller.findByEntity(
        ActivityEntityType.PROPERTY,
        '550e8400-e29b-41d4-a716-446655440001',
        filter as any,
      );

      expect(result).toEqual(paginatedResult);
      expect(mockService.findByEntity).toHaveBeenCalledWith(
        ActivityEntityType.PROPERTY,
        '550e8400-e29b-41d4-a716-446655440001',
        filter,
      );
    });

    it('should pass through filter parameters for entity query', async () => {
      mockService.findByEntity.mockResolvedValue({ ...paginatedResult, data: [] });

      const filter = { page: 2, limit: 10, from: '2026-01-01', to: '2026-06-30' };
      await controller.findByEntity(
        ActivityEntityType.CLIENT,
        'client-uuid',
        filter as any,
      );

      expect(mockService.findByEntity).toHaveBeenCalledWith(
        ActivityEntityType.CLIENT,
        'client-uuid',
        filter,
      );
    });

    it('should handle different entity types', async () => {
      mockService.findByEntity.mockResolvedValue({ ...paginatedResult, data: [] });

      for (const entityType of [
        ActivityEntityType.PROPERTY,
        ActivityEntityType.CLIENT,
        ActivityEntityType.LEAD,
        ActivityEntityType.CONTRACT,
      ]) {
        await controller.findByEntity(entityType, 'some-id', {} as any);
        expect(mockService.findByEntity).toHaveBeenCalledWith(
          entityType,
          'some-id',
          {},
        );
      }

      expect(mockService.findByEntity).toHaveBeenCalledTimes(4);
    });
  });

  describe('findByUser', () => {
    it('should return activities performed by a specific user', async () => {
      mockService.findByUser.mockResolvedValue(paginatedResult);

      const filter = { page: 1, limit: 20 };
      const result = await controller.findByUser(
        '550e8400-e29b-41d4-a716-446655440002',
        filter as any,
      );

      expect(result).toEqual(paginatedResult);
      expect(mockService.findByUser).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440002',
        filter,
      );
    });

    it('should pass through filter parameters for user query', async () => {
      mockService.findByUser.mockResolvedValue({ ...paginatedResult, data: [] });

      const filter = { page: 1, limit: 5, from: '2026-03-01' };
      await controller.findByUser('user-uuid', filter as any);

      expect(mockService.findByUser).toHaveBeenCalledWith('user-uuid', filter);
    });

    it('should return empty result when user has no activities', async () => {
      const emptyResult = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findByUser.mockResolvedValue(emptyResult);

      const result = await controller.findByUser('inactive-user', {} as any);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('purge', () => {
    it('should purge activities older than specified days', async () => {
      const purgeResult = { deleted: 42, before: '2025-12-25T00:00:00.000Z' };
      mockService.purgeOlderThan.mockResolvedValue(purgeResult);

      const result = await controller.purge(90);

      expect(result).toEqual(purgeResult);
      expect(mockService.purgeOlderThan).toHaveBeenCalledWith(90);
    });

    it('should return zero deleted when nothing to purge', async () => {
      const purgeResult = { deleted: 0, before: '2026-03-01T00:00:00.000Z' };
      mockService.purgeOlderThan.mockResolvedValue(purgeResult);

      const result = await controller.purge(1);

      expect(result.deleted).toBe(0);
      expect(mockService.purgeOlderThan).toHaveBeenCalledWith(1);
    });

    it('should handle large purge operations', async () => {
      const purgeResult = { deleted: 10000, before: '2025-01-01T00:00:00.000Z' };
      mockService.purgeOlderThan.mockResolvedValue(purgeResult);

      const result = await controller.purge(365);

      expect(result.deleted).toBe(10000);
      expect(mockService.purgeOlderThan).toHaveBeenCalledWith(365);
    });

    it('should propagate service errors', async () => {
      mockService.purgeOlderThan.mockRejectedValue(new Error('Permission denied'));

      await expect(controller.purge(30)).rejects.toThrow('Permission denied');
    });
  });
});
