import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

export interface SyncUserInput {
  authmeId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
}

/**
 * Service responsible for synchronising Authme identity data with the local
 * database.  It is intentionally lightweight — all heavy IAM logic lives in
 * the Authme server itself.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts the user record in the database on every authenticated request.
   *
   * - On first login the record is created.
   * - On subsequent logins the email, name, role, and lastLoginAt are refreshed
   *   so that changes made in the Authme admin console propagate automatically.
   */
  async syncUser(input: SyncUserInput): Promise<AuthenticatedUser> {
    const { authmeId, email, firstName, lastName, role } = input;

    const user = await this.prisma.user.upsert({
      where: { authmeId },
      create: {
        authmeId,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
        lastLoginAt: new Date(),
      },
      update: {
        email,
        firstName,
        lastName,
        role,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        authmeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return this.toAuthenticatedUser(user);
  }

  /**
   * Fetches a user by their Authme subject ID.
   * Returns null when no matching record exists.
   */
  async getUserByAuthmeId(authmeId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { authmeId },
      select: {
        id: true,
        authmeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) return null;
    return this.toAuthenticatedUser(user);
  }

  /**
   * Maps a raw Prisma user record to the AuthenticatedUser shape, adding the
   * backward-compatible `sub` and `roles` fields.
   */
  private toAuthenticatedUser(user: {
    id: string;
    authmeId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    isActive: boolean;
  }): AuthenticatedUser {
    return {
      ...user,
      // Backward-compatibility aliases used by existing controllers
      sub: user.authmeId,
      roles: [user.role.toLowerCase()],
    };
  }
}
