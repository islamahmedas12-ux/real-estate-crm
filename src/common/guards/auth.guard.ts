/**
 * Re-exports from the central auth module.
 *
 * This file is kept for backward compatibility so that existing feature
 * controllers can continue to import AuthGuard from their relative
 * '../common/guards/auth.guard.js' path.
 *
 * The real implementation lives in src/auth/guards/jwt-auth.guard.ts.
 * Note: controllers that use @UseGuards(AuthGuard) will now bind the real
 * JWT guard.  The global APP_GUARD in AppModule also ensures every route
 * is protected without needing the per-controller @UseGuards decorator.
 */
export { JwtAuthGuard as AuthGuard } from '../../auth/guards/jwt-auth.guard.js';
