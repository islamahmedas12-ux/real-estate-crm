/**
 * Integration test helper — makes authenticated API calls against a running server.
 *
 * Usage:
 *   const api = new ApiClient('http://localhost:3000/api');
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
      admin: { username: 'admin-test', password: 'Admin123!' },
      manager: { username: 'manager-test', password: 'Manager123!' },
      agent: { username: 'agent-test', password: 'Agent123!' },
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

  async post(path: string, data: any): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async patch(path: string, data: any): Promise<{ status: number; body: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
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
 * Create an ApiClient configured for the QA environment (or override via env vars).
 */
export function createApiClient(): ApiClient {
  const apiUrl = process.env['TEST_API_URL'] || 'https://qa-api.realstate-crm.homes/api';
  const authUrl = process.env['TEST_AUTH_URL'] || 'https://qa-auth.realstate-crm.homes/realms/real-estate-qa';
  const clientId = process.env['TEST_CLIENT_ID'] || 'crm-backend';
  const clientSecret = process.env['TEST_CLIENT_SECRET'] || '797e5cb4a67875e49f1711c7b7624db6fd6ff6ec4684dcc445715ec5208a85da';

  return new ApiClient(apiUrl, authUrl, clientId, clientSecret);
}
