import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import { AuthService } from '../auth.service.js';

/**
 * Passport strategy that validates Bearer JWT tokens issued by the Authme IAM server.
 *
 * The public keys are fetched dynamically from the Authme JWKS endpoint so that
 * key rotation is handled transparently.
 *
 * On every successfully validated token the strategy calls AuthService.syncUser()
 * to upsert the user record in the local database.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const authmeUrl = configService.getOrThrow<string>('AUTHME_URL');
    const realm = configService.getOrThrow<string>('AUTHME_REALM');
    // AUTHME_ISSUER_URL overrides the base URL used for JWT issuer validation.
    // This is needed when the internal AUTHME_URL (e.g. http://authme:3001) differs
    // from the public URL that Keycloak stamps into tokens (e.g. https://dev-auth.realstate-crm.homes).
    const issuerBaseUrl = configService.get<string>('AUTHME_ISSUER_URL') ?? authmeUrl;

    const jwksUri = `${authmeUrl}/realms/${realm}/protocol/openid-connect/certs`;
    const issuer = `${issuerBaseUrl}/realms/${realm}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      issuer,
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  /**
   * Called by Passport after the JWT signature has been verified.
   * Maps Authme role claims to the application UserRole enum and syncs
   * the user record in the database.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Malformed token: missing sub or email');
    }

    const role = this.mapRole(payload.realm_access?.roles ?? []);

    const user = await this.authService.syncUser({
      authmeId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
      role,
    });

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }

  /**
   * Maps Authme realm roles to the application UserRole enum.
   *
   * Priority (highest first): crm-admin → crm-manager → crm-agent → AGENT (default)
   */
  private mapRole(realmRoles: string[]): UserRole {
    if (realmRoles.includes('crm-admin')) return UserRole.ADMIN;
    if (realmRoles.includes('crm-manager')) return UserRole.MANAGER;
    if (realmRoles.includes('crm-agent')) return UserRole.AGENT;
    // Default to AGENT so any authenticated user can access the system
    return UserRole.AGENT;
  }
}
