import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockUser = (role: UserRole): AuthenticatedUser => ({
    id: 'user-1',
    authmeId: 'authme-1',
    sub: 'authme-1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role,
    roles: [role.toLowerCase()],
    isActive: true,
  });

  const mockExecutionContext = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('should allow access when no roles metadata is set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = mockExecutionContext(mockUser(UserRole.AGENT));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when roles metadata is an empty array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = mockExecutionContext(mockUser(UserRole.AGENT));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has a required role (enum value)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      const context = mockExecutionContext(mockUser(UserRole.ADMIN));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has a required role (lowercase string)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = mockExecutionContext(mockUser(UserRole.ADMIN));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'manager']);

      const context = mockExecutionContext(mockUser(UserRole.MANAGER));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'manager']);

      const context = mockExecutionContext(mockUser(UserRole.AGENT));
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Insufficient permissions');
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = mockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should handle case-insensitive comparison with enum values', () => {
      // UserRole.ADMIN is 'ADMIN', required role is 'ADMIN' (enum)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      const context = mockExecutionContext(mockUser(UserRole.ADMIN));
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should use reflector with correct metadata key', () => {
      const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = mockExecutionContext(mockUser(UserRole.AGENT));
      guard.canActivate(context);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(ROLES_KEY);
      expect(spy.mock.calls[0][1]).toHaveLength(2);
    });
  });
});
