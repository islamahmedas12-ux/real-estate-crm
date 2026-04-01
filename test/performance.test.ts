/**
 * Performance / Load Tests — Real Estate CRM
 * Issue: #63 (M3-10)
 *
 * Measures API response times and tests concurrent load.
 * Run: npx tsx test/performance.test.ts
 *
 * Targets:
 *  - API p95 < 200ms
 *  - Dashboard p95 < 500ms
 *  - Handle 50+ concurrent requests
 */

const API_URL = process.env.TEST_API_URL || 'https://qa-api.realstate-crm.homes/api';
const AUTH_URL = process.env.TEST_AUTH_URL || 'https://qa-auth.realstate-crm.homes/realms/real-estate-qa';
const CLIENT_ID = process.env.TEST_CLIENT_ID || 'crm-backend';
const CLIENT_SECRET = process.env.TEST_CLIENT_SECRET || '797e5cb4a67875e49f1711c7b7624db6fd6ff6ec4684dcc445715ec5208a85da';

interface TestResult {
  endpoint: string;
  requests: number;
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
  errors: number;
}

async function getToken(): Promise<string> {
  const res = await fetch(`${AUTH_URL}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: 'admin-test',
      password: 'Admin123!',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function measureEndpoint(
  endpoint: string,
  token: string,
  concurrency: number = 10,
  totalRequests: number = 50,
): Promise<TestResult> {
  const times: number[] = [];
  let errors = 0;

  const makeRequest = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const elapsed = performance.now() - start;
      if (res.ok) {
        times.push(elapsed);
      } else {
        errors++;
        times.push(elapsed);
      }
    } catch {
      errors++;
      times.push(performance.now() - start);
    }
  };

  // Run in batches of `concurrency`
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Math.min(concurrency, totalRequests - i);
    await Promise.all(Array.from({ length: batch }, () => makeRequest()));
  }

  times.sort((a, b) => a - b);
  const p = (pct: number) => times[Math.floor(times.length * pct / 100)] || 0;

  return {
    endpoint,
    requests: totalRequests,
    min: Math.round(times[0] || 0),
    max: Math.round(times[times.length - 1] || 0),
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    p95: Math.round(p(95)),
    p99: Math.round(p(99)),
    errors,
  };
}

async function measurePublicEndpoint(
  endpoint: string,
  concurrency: number = 10,
  totalRequests: number = 50,
): Promise<TestResult> {
  const times: number[] = [];
  let errors = 0;

  const makeRequest = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
      times.push(performance.now() - start);
      if (!res.ok) errors++;
    } catch {
      errors++;
      times.push(performance.now() - start);
    }
  };

  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Math.min(concurrency, totalRequests - i);
    await Promise.all(Array.from({ length: batch }, () => makeRequest()));
  }

  times.sort((a, b) => a - b);
  const p = (pct: number) => times[Math.floor(times.length * pct / 100)] || 0;

  return {
    endpoint,
    requests: totalRequests,
    min: Math.round(times[0] || 0),
    max: Math.round(times[times.length - 1] || 0),
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    p95: Math.round(p(95)),
    p99: Math.round(p(99)),
    errors,
  };
}

function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(90));
  console.log('PERFORMANCE TEST RESULTS');
  console.log('='.repeat(90));
  console.log(
    'Endpoint'.padEnd(35) +
    'Reqs'.padStart(6) +
    'Min'.padStart(7) +
    'Avg'.padStart(7) +
    'P95'.padStart(7) +
    'P99'.padStart(7) +
    'Max'.padStart(7) +
    'Err'.padStart(5),
  );
  console.log('-'.repeat(90));

  for (const r of results) {
    const p95Flag = r.endpoint.includes('dashboard') ? (r.p95 > 500 ? ' ⚠' : ' ✓') : (r.p95 > 200 ? ' ⚠' : ' ✓');
    console.log(
      r.endpoint.padEnd(35) +
      String(r.requests).padStart(6) +
      `${r.min}ms`.padStart(7) +
      `${r.avg}ms`.padStart(7) +
      `${r.p95}ms`.padStart(7) +
      `${r.p99}ms`.padStart(7) +
      `${r.max}ms`.padStart(7) +
      String(r.errors).padStart(5) +
      p95Flag,
    );
  }

  console.log('-'.repeat(90));

  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const avgP95 = Math.round(results.reduce((sum, r) => sum + r.p95, 0) / results.length);
  console.log(`Average P95: ${avgP95}ms | Total errors: ${totalErrors}`);
  console.log('='.repeat(90));
}

async function main() {
  console.log(`\nPerformance Test — ${API_URL}`);
  console.log(`Concurrency: 10 | Requests per endpoint: 50\n`);

  console.log('Getting auth token...');
  const token = await getToken();
  console.log('Token acquired. Starting tests...\n');

  const results: TestResult[] = [];

  // Public endpoints
  results.push(await measurePublicEndpoint('/health', 20, 100));

  // Authenticated endpoints — CRUD list operations
  results.push(await measureEndpoint('/properties', token));
  results.push(await measureEndpoint('/properties?limit=5', token));
  results.push(await measureEndpoint('/clients', token));
  results.push(await measureEndpoint('/clients?limit=5', token));
  results.push(await measureEndpoint('/leads', token));
  results.push(await measureEndpoint('/leads?limit=5', token));
  results.push(await measureEndpoint('/leads/pipeline', token));
  results.push(await measureEndpoint('/leads/stats', token));
  results.push(await measureEndpoint('/contracts', token));
  results.push(await measureEndpoint('/contracts/stats', token));
  results.push(await measureEndpoint('/invoices', token));
  results.push(await measureEndpoint('/invoices/stats', token));

  // Dashboard — heaviest queries
  results.push(await measureEndpoint('/dashboard/admin/overview', token));
  results.push(await measureEndpoint('/dashboard/admin/revenue', token));
  results.push(await measureEndpoint('/dashboard/admin/leads', token));
  results.push(await measureEndpoint('/dashboard/admin/properties', token));
  results.push(await measureEndpoint('/dashboard/admin/agents', token));
  results.push(await measureEndpoint('/dashboard/admin/recent', token));

  // High concurrency test
  console.log('\nHigh concurrency test (50 concurrent requests)...');
  results.push(await measureEndpoint('/properties', token, 50, 100));

  printResults(results);

  // Check targets
  const apiEndpoints = results.filter(r => !r.endpoint.includes('dashboard') && !r.endpoint.includes('health'));
  const dashEndpoints = results.filter(r => r.endpoint.includes('dashboard'));

  const apiP95Fail = apiEndpoints.filter(r => r.p95 > 200);
  const dashP95Fail = dashEndpoints.filter(r => r.p95 > 500);

  if (apiP95Fail.length > 0) {
    console.log(`\n⚠ ${apiP95Fail.length} API endpoints exceed 200ms P95 target`);
  }
  if (dashP95Fail.length > 0) {
    console.log(`⚠ ${dashP95Fail.length} Dashboard endpoints exceed 500ms P95 target`);
  }
  if (apiP95Fail.length === 0 && dashP95Fail.length === 0) {
    console.log('\n✅ All endpoints meet performance targets!');
  }
}

main().catch(console.error);
