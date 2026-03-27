import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const mockExecutionContext = (
    handler = jest.fn(),
    classRef = jest.fn(),
  ): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => classRef,
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('should return true for routes marked as @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = mockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should delegate to parent canActivate for non-public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // We can't easily call super.canActivate in a unit test since it
      // requires the full Passport pipeline, so we spy on the prototype.
      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      const context = mockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      superCanActivate.mockRestore();
    });

    it('should delegate to parent when no metadata is set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      const context = mockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      superCanActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 'user-1', email: 'test@test.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException when user is false', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, false)).toThrow(
        'Invalid or missing authentication token',
      );
    });

    it('should throw the original error when err is provided', () => {
      const error = new Error('Token expired');
      expect(() => guard.handleRequest(error, false)).toThrow(error);
    });

    it('should throw the original error even when user is truthy', () => {
      const error = new Error('Some auth error');
      const user = { id: 'user-1' };
      expect(() => guard.handleRequest(error, user)).toThrow(error);
    });

    it('should throw UnauthorizedException when user is null/undefined', () => {
      expect(() => guard.handleRequest(null, null as any)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
