import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import type { Request } from 'express';

/**
 * Guard that enforces role-based access control.
 *
 * Use @Roles(...) on a route handler to restrict access to specific roles.
 * If no @Roles() metadata is present the guard allows the request through.
 *
 * Accepts both UserRole enum values and lowercase string equivalents
 * (e.g. 'admin', 'manager', 'agent') so that existing @Roles('admin')
 * usage continues to work.
 *
 * Must be applied AFTER JwtAuthGuard (or globally after the JWT guard) so
 * that `request.user` is already populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    const requiredRoles = this.reflector.getAllAndOverride<(UserRole | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Normalise required roles to lowercase strings for uniform comparison.
    // UserRole.ADMIN → 'admin', 'admin' → 'admin'
    const normalised = requiredRoles.map((r) => r.toLowerCase());

    // user.role is the enum value (e.g. 'ADMIN'), user.roles is already lowercased
    const userRoleLower = user.role.toLowerCase();

    if (!normalised.includes(userRoleLower)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${normalised.join(', ')}`,
      );
    }

    return true;
  }
}
