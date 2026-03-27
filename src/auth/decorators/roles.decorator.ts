import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to users that hold at least one of the specified roles.
 * Must be used together with RolesGuard.
 *
 * Accepts both UserRole enum values and lowercase string equivalents
 * (e.g. 'admin', 'manager', 'agent') for backward compatibility with
 * controllers written before the auth module was introduced.
 *
 * @example
 * \@Roles(UserRole.ADMIN, UserRole.MANAGER)
 * \@Get('reports')
 * getReports() { ... }
 *
 * \@Roles('admin', 'manager')   // string form also accepted
 * \@Get('reports')
 * getReports() { ... }
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
