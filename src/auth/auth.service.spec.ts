import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthService, SyncUserInput } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  const sampleDbUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    authmeId: 'authme-sub-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
    isActive: true,
  };

  const sampleSyncInput: SyncUserInput = {
    authmeId: 'authme-sub-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
  };

  describe('syncUser', () => {
    it('should upsert user and return AuthenticatedUser', async () => {
      mockPrisma.user.upsert.mockResolvedValue(sampleDbUser);

      const result = await service.syncUser(sampleSyncInput);

      expect(result).toEqual({
        ...sampleDbUser,
        sub: 'authme-sub-123',
        roles: ['agent'],
      });
      expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(1);
    });

    it('should pass correct create data to upsert', async () => {
      mockPrisma.user.upsert.mockResolvedValue(sampleDbUser);

      await service.syncUser(sampleSyncInput);

      const call = mockPrisma.user.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ authmeId: 'authme-sub-123' });
      expect(call.create).toMatchObject({
        authmeId: 'authme-sub-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.AGENT,
        isActive: true,
      });
      expect(call.create.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should pass correct update data to upsert', async () => {
      mockPrisma.user.upsert.mockResolvedValue(sampleDbUser);

      await service.syncUser(sampleSyncInput);

      const call = mockPrisma.user.upsert.mock.calls[0][0];
      expect(call.update).toMatchObject({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.AGENT,
      });
      expect(call.update.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should include backward-compatible sub and roles fields', async () => {
      const adminUser = { ...sampleDbUser, role: UserRole.ADMIN };
      mockPrisma.user.upsert.mockResolvedValue(adminUser);

      const result = await service.syncUser({
        ...sampleSyncInput,
        role: UserRole.ADMIN,
      });

      expect(result.sub).toBe(adminUser.authmeId);
      expect(result.roles).toEqual(['admin']);
    });

    it('should handle null firstName and lastName', async () => {
      const userWithNulls = {
        ...sampleDbUser,
        firstName: null,
        lastName: null,
      };
      mockPrisma.user.upsert.mockResolvedValue(userWithNulls);

      const result = await service.syncUser({
        ...sampleSyncInput,
        firstName: null,
        lastName: null,
      });

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
    });
  });

  describe('getUserByAuthmeId', () => {
    it('should return AuthenticatedUser when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleDbUser);

      const result = await service.getUserByAuthmeId('authme-sub-123');

      expect(result).toEqual({
        ...sampleDbUser,
        sub: 'authme-sub-123',
        roles: ['agent'],
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { authmeId: 'authme-sub-123' },
        select: {
          id: true,
          authmeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });
    });

    it('should return null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserByAuthmeId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
