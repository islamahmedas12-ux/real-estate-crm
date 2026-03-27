/**
 * Represents the decoded JWT payload issued by the Authme (Keycloak-compatible) IAM server.
 */
export interface JwtPayload {
  /** Subject — the unique user identifier in Authme */
  sub: string;

  /** User's email address */
  email: string;

  /** Whether the email has been verified */
  email_verified?: boolean;

  /** User's given / first name */
  given_name?: string;

  /** User's family / last name */
  family_name?: string;

  /** User's display name */
  name?: string;

  /** Preferred username in Authme */
  preferred_username?: string;

  /** Realm-level role assignments */
  realm_access?: {
    roles: string[];
  };

  /** Client / resource-level role assignments */
  resource_access?: Record<
    string,
    {
      roles: string[];
    }
  >;

  /** Token issuer */
  iss?: string;

  /** Token audience */
  aud?: string | string[];

  /** Issued-at timestamp (Unix seconds) */
  iat?: number;

  /** Expiration timestamp (Unix seconds) */
  exp?: number;

  /** JWT ID */
  jti?: string;
}
