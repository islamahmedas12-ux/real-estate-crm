/**
 * Re-exports from the central auth module.
 *
 * This file is kept for backward compatibility so that existing feature
 * controllers can continue to import Public and Roles from their relative
 * '../common/decorators/roles.decorator.js' path.
 */
export { Public, IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator.js';
export { Roles, ROLES_KEY } from '../../auth/decorators/roles.decorator.js';
