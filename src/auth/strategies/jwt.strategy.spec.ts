import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy.js';
import { AuthService } from '../auth.service.js';
import type { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

// Mock passport-jwt and jwks-rsa to avoid real HTTP calls during construction
jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(() => jest.fn()),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AUTHME_URL: 'https://auth.example.com',
        AUTHME_REALM: 'crm',
      };
      return config[key];
    }),
  } as unknown as ConfigService;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'user-uuid-1',
    authmeId: 'authme-sub-123',
    sub: 'authme-sub-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
    roles: ['agent'],
    isActive: true,
  };

  beforeEach(() => {
    authService = {
      syncUser: jest.fn(),
      getUserByAuthmeId: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    strategy = new JwtStrategy(mockConfigService, authService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate and return an authenticated user with agent role', async () => {
      authService.syncUser.mockResolvedValue(mockAuthenticatedUser);

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        realm_access: { roles: ['crm-agent'] },
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockAuthenticatedUser);
      expect(authService.syncUser).toHaveBeenCalledWith({
        authmeId: 'authme-sub-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.AGENT,
      });
    });

    it('should map crm-admin role to UserRole.ADMIN', async () => {
      authService.syncUser.mockResolvedValue({
        ...mockAuthenticatedUser,
        role: UserRole.ADMIN,
      });

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
        realm_access: { roles: ['crm-admin', 'crm-agent'] },
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });

    it('should map crm-manager role to UserRole.MANAGER', async () => {
      authService.syncUser.mockResolvedValue({
        ...mockAuthenticatedUser,
        role: UserRole.MANAGER,
      });

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
        realm_access: { roles: ['crm-manager'] },
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.MANAGER }),
      );
    });

    it('should prioritize admin over manager and agent', async () => {
      authService.syncUser.mockResolvedValue({
        ...mockAuthenticatedUser,
        role: UserRole.ADMIN,
      });

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
        realm_access: { roles: ['crm-agent', 'crm-manager', 'crm-admin'] },
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });

    it('should default to AGENT when no CRM roles are present', async () => {
      authService.syncUser.mockResolvedValue(mockAuthenticatedUser);

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
        realm_access: { roles: ['some-other-role'] },
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.AGENT }),
      );
    });

    it('should default to AGENT when realm_access is undefined', async () => {
      authService.syncUser.mockResolvedValue(mockAuthenticatedUser);

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.AGENT }),
      );
    });

    it('should pass null for missing given_name and family_name', async () => {
      authService.syncUser.mockResolvedValue(mockAuthenticatedUser);

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
      };

      await strategy.validate(payload);

      expect(authService.syncUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: null,
          lastName: null,
        }),
      );
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload = { email: 'test@example.com' } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Malformed token: missing sub or email',
      );
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const payload = { sub: 'authme-sub-123' } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      authService.syncUser.mockResolvedValue({
        ...mockAuthenticatedUser,
        isActive: false,
      });

      const payload: JwtPayload = {
        sub: 'authme-sub-123',
        email: 'test@example.com',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('User account is deactivated');
    });
  });
});
