import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PropertyType, PropertyStatus } from '@prisma/client';

const mockPrisma = {
  property: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertiesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  const sampleProperty = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Luxury Apartment in Zamalek',
    description: 'A spacious 3-bedroom apartment',
    type: PropertyType.APARTMENT,
    status: PropertyStatus.AVAILABLE,
    price: '2500000.00',
    area: '180.00',
    bedrooms: 3,
    bathrooms: 2,
    floor: 5,
    address: '15 Abu El Feda St',
    city: 'Cairo',
    region: 'Zamalek',
    latitude: null,
    longitude: null,
    features: ['pool', 'gym'],
    assignedAgentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a property', async () => {
      mockPrisma.property.create.mockResolvedValue(sampleProperty);

      const dto = {
        title: 'Luxury Apartment in Zamalek',
        description: 'A spacious 3-bedroom apartment',
        type: PropertyType.APARTMENT,
        price: '2500000.00',
        area: '180.00',
        bedrooms: 3,
        bathrooms: 2,
        floor: 5,
        address: '15 Abu El Feda St',
        city: 'Cairo',
        region: 'Zamalek',
        features: ['pool', 'gym'],
      };

      const result = await service.create(dto);
      expect(result).toEqual(sampleProperty);
      expect(mockPrisma.property.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([sampleProperty]);
      mockPrisma.property.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, skip: 0 } as any);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should scope to agent when not admin', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, skip: 0 } as any, 'agent-id', false);

      const whereArg = mockPrisma.property.findMany.mock.calls[0][0].where;
      expect(whereArg.assignedAgentId).toBe('agent-id');
    });

    it('should not scope when admin/manager', async () => {
      mockPrisma.property.findMany.mockResolvedValue([sampleProperty]);
      mockPrisma.property.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 20, skip: 0 } as any, 'agent-id', true);

      const whereArg = mockPrisma.property.findMany.mock.calls[0][0].where;
      expect(whereArg.assignedAgentId).toBeUndefined();
    });

    it('should apply price range filters', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 20,
        skip: 0,
        minPrice: '100000',
        maxPrice: '500000',
      } as any);

      const whereArg = mockPrisma.property.findMany.mock.calls[0][0].where;
      expect(whereArg.price).toEqual({ gte: '100000', lte: '500000' });
    });
  });

  describe('findOne', () => {
    it('should return a property with images', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(sampleProperty);

      const result = await service.findOne(sampleProperty.id);
      expect(result).toEqual(sampleProperty);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: sampleProperty.id });
      mockPrisma.property.update.mockResolvedValue({ ...sampleProperty, title: 'Updated' });

      const result = await service.update(sampleProperty.id, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException when property does not exist', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete by setting status to OFF_MARKET', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: sampleProperty.id });
      mockPrisma.property.update.mockResolvedValue({
        ...sampleProperty,
        status: PropertyStatus.OFF_MARKET,
      });

      const result = await service.remove(sampleProperty.id);
      expect(result.status).toBe(PropertyStatus.OFF_MARKET);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: sampleProperty.id },
        data: { status: 'OFF_MARKET' },
      });
    });
  });

  describe('changeStatus', () => {
    it('should update property status', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: sampleProperty.id });
      mockPrisma.property.update.mockResolvedValue({
        ...sampleProperty,
        status: PropertyStatus.RESERVED,
      });

      const result = await service.changeStatus(sampleProperty.id, PropertyStatus.RESERVED);
      expect(result.status).toBe(PropertyStatus.RESERVED);
    });
  });

  describe('assignAgent', () => {
    it('should assign an agent to a property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: sampleProperty.id });
      mockPrisma.property.update.mockResolvedValue({
        ...sampleProperty,
        assignedAgentId: 'agent-1',
      });

      const result = await service.assignAgent(sampleProperty.id, 'agent-1');
      expect(result.assignedAgentId).toBe('agent-1');
    });
  });

  describe('getStats', () => {
    it('should return property statistics', async () => {
      mockPrisma.property.count.mockResolvedValue(10);
      mockPrisma.property.groupBy
        .mockResolvedValueOnce([{ type: PropertyType.APARTMENT, _count: 5 }])
        .mockResolvedValueOnce([{ status: PropertyStatus.AVAILABLE, _count: 8 }])
        .mockResolvedValueOnce([{ city: 'Cairo', _count: 7 }]);

      const result = await service.getStats();
      expect(result.total).toBe(10);
      expect(result.byType).toHaveLength(1);
      expect(result.byStatus).toHaveLength(1);
      expect(result.byCity).toHaveLength(1);
    });
  });
});
