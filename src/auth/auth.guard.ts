/**
 * auth.guard.ts — Public re-export barrel for auth guards
 *
 * Issue #4: Backend Auth Guard (JWT via AuthMe JWKS)
 * Implemented by: Karim Mostafa (Backend Developer)
 *
 * The full guard implementation lives in:
 *   - src/auth/guards/jwt-auth.guard.ts   — JwtAuthGuard (validates Bearer JWT via JWKS)
 *   - src/auth/guards/roles.guard.ts      — RolesGuard (RBAC enforcement)
 *   - src/auth/strategies/jwt.strategy.ts — JwtStrategy (JWKS validation via jwks-rsa)
 *   - src/auth/decorators/current-user.decorator.ts — @CurrentUser() param decorator
 *
 * JWKS endpoint: https://dev-auth.realstate-crm.homes/.well-known/jwks.json
 *   (configured via AUTHME_URL + AUTHME_REALM env vars — see jwt.strategy.ts)
 *
 * Usage:
 *   import { JwtAuthGuard } from './auth.guard';
 *   import { CurrentUser } from './auth.guard';
 */

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard.js';
export { RolesGuard } from './guards/roles.guard.js';

// Strategy
export { JwtStrategy } from './strategies/jwt.strategy.js';

// Decorators
export { CurrentUser } from './decorators/current-user.decorator.js';
export { Roles } from './decorators/roles.decorator.js';
export { Public } from './decorators/public.decorator.js';

// Interfaces
export type { JwtPayload } from './interfaces/jwt-payload.interface.js';
export type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';
