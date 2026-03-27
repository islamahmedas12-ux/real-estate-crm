import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

/**
 * Global authentication & authorisation module.
 *
 * Registers:
 *  - PassportModule with 'jwt' as the default strategy
 *  - JwtModule configured to validate RS256 tokens issued by the Authme server
 *    (the actual key material is fetched via JWKS inside JwtStrategy)
 *  - JwtStrategy, JwtAuthGuard, RolesGuard
 *  - AuthService for user synchronisation
 *
 * Decorated with @Global() so that guards and the AuthService are available
 * throughout the application without needing to import AuthModule everywhere.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const authmeUrl = config.getOrThrow<string>('AUTHME_URL');
        const realm = config.getOrThrow<string>('AUTHME_REALM');
        return {
          // The actual signing key is resolved via JWKS in the strategy.
          // We still configure the module so that @nestjs/jwt utilities work
          // when needed elsewhere (e.g., token introspection helpers).
          verifyOptions: {
            issuer: `${authmeUrl}/realms/${realm}`,
            algorithms: ['RS256'],
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, PassportModule, JwtModule],
})
export class AuthModule {}
