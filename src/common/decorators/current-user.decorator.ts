/**
 * Re-exports from the central auth module.
 *
 * This file is kept for backward compatibility so that existing feature
 * controllers can continue to import CurrentUser and AuthenticatedUser
 * from their relative '../common/decorators/current-user.decorator.js' path.
 */
export { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
export type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';
