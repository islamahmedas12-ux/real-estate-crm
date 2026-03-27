import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route handler or controller as publicly accessible.
 * Routes decorated with @Public() will bypass the global JwtAuthGuard.
 *
 * @example
 * \@Public()
 * \@Get('health')
 * healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
