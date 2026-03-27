import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { PropertyType, PropertyStatus, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  changeStatus: jest.fn(),
  assignAgent: jest.fn(),
  getStats: jest.fn(),
  fullTextSearch: jest.fn(),
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

const sampleProperty = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Luxury 3BR Apartment in Zamalek',
  description: 'Spacious apartment with Nile view',
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
  latitude: '30.0561000',
  longitude: '31.2243000',
  features: ['pool', 'gym', 'parking'],
  assignedAgentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PropertiesController', () => {
  let controller: PropertiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [{ provide: PropertiesService, useValue: mockService }],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a property', async () => {
      mockService.create.mockResolvedValue(sampleProperty);

      const dto = {
        title: 'Luxury 3BR Apartment in Zamalek',
        description: 'Spacious apartment with Nile view',
        type: PropertyType.APARTMENT,
        price: '2500000.00',
        area: '180.00',
        bedrooms: 3,
        bathrooms: 2,
        floor: 5,
        address: '15 Abu El Feda St',
        city: 'Cairo',
        region: 'Zamalek',
        features: ['pool', 'gym', 'parking'],
      };

      const result = await controller.create(dto as any);
      expect(result).toEqual(sampleProperty);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should create a property with minimal fields', async () => {
      const minimalProperty = { ...sampleProperty, description: undefined, features: undefined };
      mockService.create.mockResolvedValue(minimalProperty);

      const dto = {
        title: 'Basic Land Plot',
        type: PropertyType.LAND,
        price: '500000.00',
        area: '1000.00',
        address: '10 Main St',
        city: 'Giza',
        region: '6th of October',
      };

      const result = await controller.create(dto as any);
      expect(result).toEqual(minimalProperty);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated properties for admin', async () => {
      const paginated = { data: [sampleProperty], total: 1, page: 1, limit: 20, totalPages: 1 };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({} as any, adminUser);
      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith({}, adminUser.sub, true);
    });

    it('should return paginated properties for manager', async () => {
      const paginated = { data: [sampleProperty], total: 1, page: 1, limit: 20, totalPages: 1 };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({} as any, managerUser);
      expect(result).toEqual(paginated);
      expect(mockService.findAll).toHaveBeenCalledWith({}, managerUser.sub, true);
    });

    it('should scope results for agent users', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(paginated);

      await controller.findAll({} as any, agentUser);
      expect(mockService.findAll).toHaveBeenCalledWith({}, agentUser.sub, false);
    });

    it('should pass filter parameters to service', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(paginated);

      const filter = {
        type: PropertyType.VILLA,
        status: PropertyStatus.AVAILABLE,
        city: 'Cairo',
        minPrice: '1000000',
        maxPrice: '5000000',
        bedrooms: 3,
        sortBy: 'price' as const,
        sortOrder: 'asc' as const,
      };

      await controller.findAll(filter as any, adminUser);
      expect(mockService.findAll).toHaveBeenCalledWith(filter, adminUser.sub, true);
    });

    it('should handle undefined user roles gracefully', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(paginated);

      const userWithNoRoles = { sub: 'user-001', email: 'user@test.com' } as AuthenticatedUser;

      await controller.findAll({} as any, userWithNoRoles);
      expect(mockService.findAll).toHaveBeenCalledWith({}, userWithNoRoles.sub, false);
    });
  });

  describe('fullTextSearch', () => {
    it('should perform full-text search for admin', async () => {
      const searchResult = { data: [sampleProperty], nextCursor: null, hasMore: false };
      mockService.fullTextSearch.mockResolvedValue(searchResult);

      const dto = { q: 'villa cairo', take: 20 };
      const result = await controller.fullTextSearch(dto as any, adminUser);

      expect(result).toEqual(searchResult);
      expect(mockService.fullTextSearch).toHaveBeenCalledWith(
        'villa cairo',
        undefined,
        20,
        adminUser.sub,
        true,
      );
    });

    it('should pass cursor for pagination', async () => {
      const cursorId = '550e8400-e29b-41d4-a716-446655440000';
      const searchResult = { data: [sampleProperty], nextCursor: null, hasMore: false };
      mockService.fullTextSearch.mockResolvedValue(searchResult);

      const dto = { q: 'apartment', cursor: cursorId, take: 10 };
      await controller.fullTextSearch(dto as any, adminUser);

      expect(mockService.fullTextSearch).toHaveBeenCalledWith(
        'apartment',
        cursorId,
        10,
        adminUser.sub,
        true,
      );
    });

    it('should scope search results for agent users', async () => {
      const searchResult = { data: [], nextCursor: null, hasMore: false };
      mockService.fullTextSearch.mockResolvedValue(searchResult);

      const dto = { q: 'office', take: 20 };
      await controller.fullTextSearch(dto as any, agentUser);

      expect(mockService.fullTextSearch).toHaveBeenCalledWith(
        'office',
        undefined,
        20,
        agentUser.sub,
        false,
      );
    });

    it('should handle undefined user roles gracefully', async () => {
      const searchResult = { data: [], nextCursor: null, hasMore: false };
      mockService.fullTextSearch.mockResolvedValue(searchResult);

      const userWithNoRoles = { sub: 'user-001', email: 'user@test.com' } as AuthenticatedUser;
      const dto = { q: 'land', take: 20 };
      await controller.fullTextSearch(dto as any, userWithNoRoles);

      expect(mockService.fullTextSearch).toHaveBeenCalledWith(
        'land',
        undefined,
        20,
        userWithNoRoles.sub,
        false,
      );
    });
  });

  describe('getStats', () => {
    it('should return statistics for admin', async () => {
      const stats = {
        total: 100,
        byType: [{ type: PropertyType.APARTMENT, count: 60 }],
        byStatus: [{ status: PropertyStatus.AVAILABLE, count: 80 }],
        byCity: [{ city: 'Cairo', count: 50 }],
      };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(adminUser);
      expect(result.total).toBe(100);
      expect(mockService.getStats).toHaveBeenCalledWith(adminUser.sub, true);
    });

    it('should return statistics for manager', async () => {
      const stats = { total: 50, byType: [], byStatus: [], byCity: [] };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(managerUser);
      expect(result.total).toBe(50);
      expect(mockService.getStats).toHaveBeenCalledWith(managerUser.sub, true);
    });

    it('should scope stats for agent users', async () => {
      mockService.getStats.mockResolvedValue({ total: 5, byType: [], byStatus: [], byCity: [] });

      await controller.getStats(agentUser);
      expect(mockService.getStats).toHaveBeenCalledWith(agentUser.sub, false);
    });

    it('should handle undefined user roles gracefully', async () => {
      mockService.getStats.mockResolvedValue({ total: 0, byType: [], byStatus: [], byCity: [] });

      const userWithNoRoles = { sub: 'user-001', email: 'user@test.com' } as AuthenticatedUser;
      await controller.getStats(userWithNoRoles);
      expect(mockService.getStats).toHaveBeenCalledWith(userWithNoRoles.sub, false);
    });
  });

  describe('findOne', () => {
    it('should return a single property with relations', async () => {
      const propertyWithRelations = {
        ...sampleProperty,
        images: [],
        _count: { leads: 0, contracts: 0 },
      };
      mockService.findOne.mockResolvedValue(propertyWithRelations);

      const result = await controller.findOne(sampleProperty.id);
      expect(result.id).toBe(sampleProperty.id);
      expect(mockService.findOne).toHaveBeenCalledWith(sampleProperty.id);
    });

    it('should propagate NotFoundException when property not found', async () => {
      mockService.findOne.mockRejectedValue(
        new Error('Property with ID "nonexistent-id" not found'),
      );

      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(
        'Property with ID "nonexistent-id" not found',
      );
      expect(mockService.findOne).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const updated = { ...sampleProperty, title: 'Updated Title', price: '3000000.00' };
      mockService.update.mockResolvedValue(updated);

      const dto = { title: 'Updated Title', price: '3000000.00' };
      const result = await controller.update(sampleProperty.id, dto as any);
      expect(result.title).toBe('Updated Title');
      expect(result.price).toBe('3000000.00');
      expect(mockService.update).toHaveBeenCalledWith(sampleProperty.id, dto);
    });

    it('should propagate NotFoundException when property not found', async () => {
      mockService.update.mockRejectedValue(
        new Error('Property with ID "nonexistent-id" not found'),
      );

      await expect(
        controller.update('nonexistent-id', { title: 'Test' } as any),
      ).rejects.toThrow('Property with ID "nonexistent-id" not found');
    });
  });

  describe('remove', () => {
    it('should soft-delete a property (admin only)', async () => {
      const removed = { ...sampleProperty, status: PropertyStatus.OFF_MARKET };
      mockService.remove.mockResolvedValue(removed);

      const result = await controller.remove(sampleProperty.id);
      expect(result.status).toBe(PropertyStatus.OFF_MARKET);
      expect(mockService.remove).toHaveBeenCalledWith(sampleProperty.id);
    });

    it('should propagate NotFoundException when property not found', async () => {
      mockService.remove.mockRejectedValue(
        new Error('Property with ID "nonexistent-id" not found'),
      );

      await expect(controller.remove('nonexistent-id')).rejects.toThrow(
        'Property with ID "nonexistent-id" not found',
      );
    });
  });

  describe('changeStatus', () => {
    it('should change property status to SOLD', async () => {
      const updated = { ...sampleProperty, status: PropertyStatus.SOLD };
      mockService.changeStatus.mockResolvedValue(updated);

      const dto = { status: PropertyStatus.SOLD };
      const result = await controller.changeStatus(sampleProperty.id, dto);
      expect(result.status).toBe(PropertyStatus.SOLD);
      expect(mockService.changeStatus).toHaveBeenCalledWith(sampleProperty.id, PropertyStatus.SOLD);
    });

    it('should change property status to RESERVED', async () => {
      const updated = { ...sampleProperty, status: PropertyStatus.RESERVED };
      mockService.changeStatus.mockResolvedValue(updated);

      const dto = { status: PropertyStatus.RESERVED };
      const result = await controller.changeStatus(sampleProperty.id, dto);
      expect(result.status).toBe(PropertyStatus.RESERVED);
      expect(mockService.changeStatus).toHaveBeenCalledWith(sampleProperty.id, PropertyStatus.RESERVED);
    });

    it('should change property status to RENTED', async () => {
      const updated = { ...sampleProperty, status: PropertyStatus.RENTED };
      mockService.changeStatus.mockResolvedValue(updated);

      const dto = { status: PropertyStatus.RENTED };
      const result = await controller.changeStatus(sampleProperty.id, dto);
      expect(result.status).toBe(PropertyStatus.RENTED);
      expect(mockService.changeStatus).toHaveBeenCalledWith(sampleProperty.id, PropertyStatus.RENTED);
    });

    it('should propagate NotFoundException when property not found', async () => {
      mockService.changeStatus.mockRejectedValue(
        new Error('Property with ID "nonexistent-id" not found'),
      );

      await expect(
        controller.changeStatus('nonexistent-id', { status: PropertyStatus.SOLD } as any),
      ).rejects.toThrow('Property with ID "nonexistent-id" not found');
    });
  });

  describe('assignAgent', () => {
    it('should assign an agent to a property', async () => {
      const agentId = '550e8400-e29b-41d4-a716-446655440001';
      const assigned = { ...sampleProperty, assignedAgentId: agentId };
      mockService.assignAgent.mockResolvedValue(assigned);

      const result = await controller.assignAgent(sampleProperty.id, { agentId });
      expect(result.assignedAgentId).toBe(agentId);
      expect(mockService.assignAgent).toHaveBeenCalledWith(sampleProperty.id, agentId);
    });

    it('should propagate NotFoundException when property not found', async () => {
      mockService.assignAgent.mockRejectedValue(
        new Error('Property with ID "nonexistent-id" not found'),
      );

      const agentId = '550e8400-e29b-41d4-a716-446655440001';
      await expect(
        controller.assignAgent('nonexistent-id', { agentId }),
      ).rejects.toThrow('Property with ID "nonexistent-id" not found');
    });
  });
});
