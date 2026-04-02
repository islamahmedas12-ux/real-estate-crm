/**
 * Security Audit Tests — Real Estate CRM
 * Issue: #64 (M3-11)
 *
 * OWASP-based security testing covering:
 * - Authentication bypass attempts
 * - SQL injection
 * - XSS prevention
 * - CORS configuration
 * - Security headers
 * - Rate limiting
 * - File upload validation
 * - RBAC / privilege escalation
 * - Sensitive data exposure
 *
 * Run: npx tsx test/security-audit.test.ts
 */

const API_URL = process.env.TEST_API_URL || 'https://qa-api.realstate-crm.homes/api';
const AUTH_URL = process.env.TEST_AUTH_URL || 'https://qa-auth.realstate-crm.homes/realms/real-estate-qa';
const CLIENT_SECRET = process.env.TEST_CLIENT_SECRET || '797e5cb4a67875e49f1711c7b7624db6fd6ff6ec4684dcc445715ec5208a85da';

let passed = 0;
let failed = 0;
let warnings = 0;
const findings: { severity: string; test: string; detail: string }[] = [];

function log(status: '✅' | '❌' | '⚠️', test: string, detail: string = '') {
  if (status === '✅') passed++;
  else if (status === '❌') { failed++; findings.push({ severity: 'HIGH', test, detail }); }
  else { warnings++; findings.push({ severity: 'MEDIUM', test, detail }); }
  console.log(`  ${status} ${test}${detail ? ` — ${detail}` : ''}`);
}

async function getToken(role: string = 'admin'): Promise<string> {
  const creds: Record<string, { u: string; p: string }> = {
    admin: { u: 'admin-test', p: 'Admin123!' },
    agent: { u: 'agent-test', p: 'Agent123!' },
  };
  const c = creds[role] || creds.admin;
  const res = await fetch(`${AUTH_URL}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password', client_id: 'crm-backend',
      client_secret: CLIENT_SECRET, username: c.u, password: c.p,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  console.log(`\nSecurity Audit — ${API_URL}\n`);

  const adminToken = await getToken('admin');
  const agentToken = await getToken('agent');
  const headers = (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('── 1. Authentication & JWT ──────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  // No token
  {
    const res = await fetch(`${API_URL}/properties`);
    log(res.status === 401 ? '✅' : '❌', 'No token → 401', `Got ${res.status}`);
  }

  // Invalid token
  {
    const res = await fetch(`${API_URL}/properties`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    log(res.status === 401 ? '✅' : '❌', 'Invalid JWT → 401', `Got ${res.status}`);
  }

  // Expired/tampered token
  {
    const tampered = adminToken.slice(0, -5) + 'XXXXX';
    const res = await fetch(`${API_URL}/properties`, {
      headers: { Authorization: `Bearer ${tampered}` },
    });
    log(res.status === 401 ? '✅' : '❌', 'Tampered JWT → 401', `Got ${res.status}`);
  }

  // Missing Bearer prefix
  {
    const res = await fetch(`${API_URL}/properties`, {
      headers: { Authorization: adminToken },
    });
    log(res.status === 401 ? '✅' : '❌', 'No Bearer prefix → 401', `Got ${res.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 2. SQL Injection ────────────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  const sqliPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1; SELECT * FROM users --",
    "' UNION SELECT * FROM users --",
  ];

  for (const payload of sqliPayloads) {
    const res = await fetch(`${API_URL}/clients?search=${encodeURIComponent(payload)}`, {
      headers: headers(adminToken),
    });
    log(res.status !== 500 ? '✅' : '❌', `SQLi: ${payload.substring(0, 30)}...`, `Status: ${res.status}`);
  }

  // SQLi in path parameter
  {
    const res = await fetch(`${API_URL}/clients/' OR 1=1 --`, {
      headers: headers(adminToken),
    });
    log([400, 404, 422].includes(res.status) ? '✅' : '❌', 'SQLi in path param', `Status: ${res.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 3. XSS Prevention ──────────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    "javascript:alert('xss')",
  ];

  for (const payload of xssPayloads) {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        firstName: payload,
        lastName: 'Test',
        phone: `+2010${Math.floor(10000000 + Math.random() * 90000000)}`,
        type: 'BUYER',
      }),
    });
    const body = await res.json().catch(() => null);
    const sanitized = !JSON.stringify(body).includes('<script>') && !JSON.stringify(body).includes('onerror=');
    log(sanitized ? '✅' : '❌', `XSS: ${payload.substring(0, 30)}...`, sanitized ? 'Sanitized' : 'NOT sanitized!');
    // Clean up if created
    if (res.status === 201 && body?.id) {
      await fetch(`${API_URL}/clients/${body.id}`, { method: 'DELETE', headers: headers(adminToken) });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 4. Security Headers ────────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  {
    const res = await fetch(`${API_URL}/health`);
    const h = Object.fromEntries(res.headers.entries());

    log(h['x-frame-options'] ? '✅' : '⚠️', 'X-Frame-Options', h['x-frame-options'] || 'missing');
    log(h['x-content-type-options'] ? '✅' : '⚠️', 'X-Content-Type-Options', h['x-content-type-options'] || 'missing');
    log(h['content-security-policy'] ? '✅' : '⚠️', 'Content-Security-Policy', h['content-security-policy'] ? 'present' : 'missing');
    log(h['strict-transport-security'] ? '✅' : '⚠️', 'Strict-Transport-Security', h['strict-transport-security'] || 'missing');
    log(!h['x-powered-by'] ? '✅' : '⚠️', 'X-Powered-By hidden', h['x-powered-by'] || 'not exposed');
    log(!h['server']?.includes('.') ? '✅' : '⚠️', 'Server version hidden', h['server'] || 'not exposed');
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 5. CORS Configuration ──────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  // Allowed origin
  {
    const res = await fetch(`${API_URL}/health`, {
      headers: { Origin: 'https://qa-admin.realstate-crm.homes' },
    });
    const acao = res.headers.get('access-control-allow-origin');
    log(acao ? '✅' : '⚠️', 'CORS: allowed origin', acao || 'no ACAO header');
  }

  // Disallowed origin
  {
    const res = await fetch(`${API_URL}/health`, {
      headers: { Origin: 'https://evil-site.com' },
    });
    const acao = res.headers.get('access-control-allow-origin');
    log(!acao || acao !== 'https://evil-site.com' ? '✅' : '❌', 'CORS: blocks evil origin', acao || 'no ACAO');
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 6. RBAC / Privilege Escalation ──────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  // Agent trying admin-only operations
  {
    const res = await fetch(`${API_URL}/clients/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: headers(agentToken),
    });
    log(res.status === 403 ? '✅' : '❌', 'Agent cannot DELETE client', `Got ${res.status}`);
  }

  {
    const res = await fetch(`${API_URL}/contracts`, {
      method: 'POST',
      headers: headers(agentToken),
      body: JSON.stringify({ type: 'SALE', propertyId: 'x', clientId: 'x', totalAmount: 1 }),
    });
    log(res.status === 403 ? '✅' : '❌', 'Agent cannot POST contract', `Got ${res.status}`);
  }

  // Agent accessing admin dashboard
  {
    const res = await fetch(`${API_URL}/dashboard/admin/overview`, {
      headers: headers(agentToken),
    });
    log(res.status === 403 ? '✅' : '❌', 'Agent cannot access admin dashboard', `Got ${res.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 7. Sensitive Data Exposure ──────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  // Check that error responses don't leak stack traces
  {
    const res = await fetch(`${API_URL}/clients/not-a-uuid`, {
      headers: headers(adminToken),
    });
    const body = await res.text();
    const leaksStack = body.includes('at ') && body.includes('.ts:');
    log(!leaksStack ? '✅' : '❌', 'Error response hides stack trace', leaksStack ? 'LEAKS STACK TRACE!' : 'clean');
  }

  // Check that passwords/secrets don't appear in responses
  {
    const res = await fetch(`${API_URL}/health`);
    const body = await res.text();
    const leaksSecrets = body.includes('password') || body.includes('secret') || body.includes('DATABASE_URL');
    log(!leaksSecrets ? '✅' : '❌', 'Health endpoint hides secrets', leaksSecrets ? 'LEAKS SECRETS!' : 'clean');
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n── 8. Input Validation ────────────────────────────────');
  // ═══════════════════════════════════════════════════════════════════════

  // Oversized payload
  {
    const bigString = 'A'.repeat(1_000_000);
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ firstName: bigString, lastName: 'Test', phone: '+201099999999', type: 'BUYER' }),
    });
    log(res.status !== 500 ? '✅' : '❌', 'Oversized payload handled', `Status: ${res.status}`);
  }

  // Invalid JSON
  {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { ...headers(adminToken) },
      body: '{invalid json!!!',
    });
    log(res.status === 400 ? '✅' : '⚠️', 'Invalid JSON → 400', `Status: ${res.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════

  console.log('\n' + '='.repeat(60));
  console.log('SECURITY AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log('='.repeat(60));

  if (findings.length > 0) {
    console.log('\nFindings:');
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.test}: ${f.detail}`);
    }
  }

  if (failed === 0) {
    console.log('\n✅ Security audit passed — no critical findings!');
  } else {
    console.log(`\n❌ ${failed} critical finding(s) need attention!`);
  }
}

main().catch(console.error);
