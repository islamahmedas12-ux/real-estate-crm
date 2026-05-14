/**
 * Integration test helper — makes authenticated API calls against a running server.
 *
 * Usage:
 *   const api = createApiClient();
 *   await api.loginAs('admin');
 *   const res = await api.get('/clients');
 */

export class ApiClient {
  private token: string | null = null;

  constructor(
    private baseUrl: string,
    private authUrl: string,
    private clientId: string,
    private clientSecret: string,
  ) {}

  async loginAs(role: 'admin' | 'manager' | 'agent'): Promise<void> {
    const credentials: Record<string, { username: string; password: string }> = {
      admin: {
        username: process.env['TEST_USER_ADMIN'] ?? 'admin-test',
        password: process.env['TEST_PASS_ADMIN'] ?? 'Admin123!',
      },
      manager: {
        username: process.env['TEST_USER_MANAGER'] ?? 'manager-test',
        password: process.env['TEST_PASS_MANAGER'] ?? 'Manager123!',
      },
      agent: {
        username: process.env['TEST_USER_AGENT'] ?? 'agent-test',
        password: process.env['TEST_PASS_AGENT'] ?? 'Agent123!',
      },
    };

    const cred = credentials[role];
    const res = await fetch(`${this.authUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: cred.username,
        password: cred.password,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Login failed for ${role}: ${res.status} ${body}`);
    }

    const data = await res.json();
    this.token = data.access_token;
  }

  clearAuth(): void {
    this.token = null;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async get(path: string): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async post(path: string, data: unknown): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async patch(path: string, data: unknown): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async put(path: string, data: unknown): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async delete(path: string): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }
}

/**
 * Create an ApiClient configured via environment variables.
 * All values can be overridden via TEST_* env vars.
 */
export function createApiClient(): ApiClient {
  const apiUrl = process.env['TEST_API_URL'] || 'http://localhost:3000/api';
  const authUrl = process.env['TEST_AUTH_URL'] || 'http://localhost:3001/realms/real-estate';
  const clientId = process.env['TEST_CLIENT_ID'] || 'crm-backend';
  const clientSecret = process.env['TEST_CLIENT_SECRET'] || '';

  if (!clientSecret) {
    throw new Error('TEST_CLIENT_SECRET environment variable is required');
  }

  return new ApiClient(apiUrl, authUrl, clientId, clientSecret);
}

/**
 * Entity tracking for integration test cleanup.
 * Use trackEntity('clients', id) after POST creates a resource.
 * Call cleanupAll(api) in afterAll to delete tracked entities.
 */
const createdEntities: Array<{ type: string; id: string }> = [];

export function trackEntity(type: string, id: string): void {
  createdEntities.push({ type, id });
}

export async function cleanupAll(api: ApiClient): Promise<void> {
  for (const entity of [...createdEntities].reverse()) {
    try {
      await api.delete(`/${entity.type}/${entity.id}`);
    } catch {
      // Best-effort cleanup
    }
  }
  createdEntities.length = 0;
}
