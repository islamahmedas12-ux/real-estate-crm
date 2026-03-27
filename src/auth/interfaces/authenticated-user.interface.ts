import { UserRole } from '@prisma/client';

/**
 * Represents the user object attached to the Express request after successful
 * JWT validation and optional DB sync via AuthService.
 */
export interface AuthenticatedUser {
  /** Internal DB primary key (UUID) */
  id: string;

  /** Authme subject ID (maps to JWT `sub`) */
  authmeId: string;

  /**
   * Backward-compatibility alias for authmeId.
   * Existing controllers reference user.sub — this field satisfies those
   * usages until controllers are migrated to use authmeId directly.
   */
  sub: string;

  /** User email */
  email: string;

  /** First name */
  firstName: string | null;

  /** Last name */
  lastName: string | null;

  /** Application-level role (enum) */
  role: UserRole;

  /**
   * Backward-compatibility string array of roles.
   * Existing controllers check user.roles.includes('admin') etc.
   * This field contains the lowercase string representation of `role`.
   */
  roles: string[];

  /** Whether the account is active */
  isActive: boolean;
}
