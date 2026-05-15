import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  lead: { count: jest.fn() },
  invoice: { aggregate: jest.fn() },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns paginated users', async () => {
      const users = [
        { id: '1', email: 'a@test.com', firstName: 'A', lastName: 'B', role: UserRole.AGENT },
        { id: '2', email: 'b@test.com', firstName: 'B', lastName: 'C', role: UserRole.AGENT },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('filters by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, role: 'ADMIN' });

      expect(mockPrisma.user.findMany.mock.calls[0][0].where.role).toBe(UserRole.ADMIN);
    });

    it('filters by search term', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'test' });

      expect(mockPrisma.user.findMany.mock.calls[0][0].where.OR).toBeDefined();
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow('User not found');
    });

    it('returns user with performance stats', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'a@test.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.AGENT,
        assignedProperties: [],
        assignedClients: [],
        assignedLeads: [],
      });
      mockPrisma.lead.count.mockResolvedValue(10);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });

      const result = await service.getById('1');

      expect(result.performance).toBeDefined();
      expect(result.performance.totalLeads).toBe(10);
    });
  });

  describe('toggleActive', () => {
    it('updates isActive flag', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: '1', isActive: false });

      const result = await service.toggleActive('1', false);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });
});
