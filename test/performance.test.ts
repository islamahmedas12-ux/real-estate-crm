/**
 * Performance / Load Tests — Real Estate CRM
 * Issue: #63 (M3-10), #257 (M8-10)
 *
 * Measures API response times and tests concurrent load.
 * Run: npx tsx test/performance.test.ts
 *
 * Targets:
 *  - API p95 < 200ms
 *  - Dashboard p95 < 500ms
 *  - Handle 50+ concurrent requests
 *
 * CI mode: exit code 1 if any threshold exceeded.
 */

const API_URL = process.env.TEST_API_URL || 'https://qa-api.realstate-crm.homes/api';
const AUTH_URL =
  process.env.TEST_AUTH_URL || 'https://qa-auth.realestate-crm.homes/realms/real-estate-qa';
const CLIENT_ID = process.env.TEST_CLIENT_ID || 'crm-backend';
const CLIENT_SECRET =
  process.env.TEST_CLIENT_SECRET ||
  '797e5cb4a67875e49f1711c7b7624db6fd6ff6ec4684dcc445715ec5208a85da';

const CI_MODE = process.env.CI === 'true';

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
      username: process.env.TEST_USER_ADMIN || 'admin-test',
      password: process.env.TEST_PASS_ADMIN || 'Admin123!',
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
      times.push(elapsed);
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
  const p = (pct: number) => times[Math.floor((times.length * pct) / 100)] || 0;

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
  const p = (pct: number) => times[Math.floor((times.length * pct) / 100)] || 0;

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

interface Threshold {
  pct: number;
  value: number;
}

function assertThresholds(results: TestResult[], thresholds: Map<string, Threshold[]>) {
  const failures: string[] = [];

  for (const r of results) {
    const t = thresholds.get(r.endpoint);
    if (!t) continue;
    for (const threshold of t) {
      if (r.p95 > threshold.value) {
        failures.push(
          `FAIL: ${r.endpoint} P95=${r.p95}ms exceeds threshold=${threshold.value}ms (target ${threshold.pct}%)`,
        );
      }
    }
  }

  return failures;
}

function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(90));
  console.log('PERFORMANCE TEST RESULTS');
  console.log('='.repeat(90));
  console.log(
    'Endpoint'.padEnd(40) +
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
    const isDashboard = r.endpoint.includes('dashboard');
    const threshold = isDashboard ? 500 : 200;
    const flag = r.p95 > threshold ? ' ⚠' : ' ✓';
    console.log(
      r.endpoint.padEnd(40) +
        String(r.requests).padStart(6) +
        `${r.min}ms`.padStart(7) +
        `${r.avg}ms`.padStart(7) +
        `${r.p95}ms`.padStart(7) +
        `${r.p99}ms`.padStart(7) +
        `${r.max}ms`.padStart(7) +
        String(r.errors).padStart(5) +
        flag,
    );
  }

  console.log('-'.repeat(90));

  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const avgP95 = Math.round(results.reduce((sum, r) => sum + r.p95, 0) / results.length);
  console.log(`Average P95: ${avgP95}ms | Total errors: ${totalErrors}`);
  console.log('='.repeat(90));
}

async function main() {
  const failures: string[] = [];

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

  // Threshold definitions
  const thresholds = new Map<string, Threshold[]>([
    ['/health', [{ pct: 95, value: 100 }]],
    ['/properties', [{ pct: 95, value: 200 }]],
    ['/clients', [{ pct: 95, value: 200 }]],
    ['/leads', [{ pct: 95, value: 200 }]],
    ['/contracts', [{ pct: 95, value: 200 }]],
    ['/invoices', [{ pct: 95, value: 200 }]],
    ['/dashboard/admin/overview', [{ pct: 95, value: 500 }]],
    ['/dashboard/admin/revenue', [{ pct: 95, value: 500 }]],
    ['/dashboard/admin/leads', [{ pct: 95, value: 500 }]],
    ['/dashboard/admin/properties', [{ pct: 95, value: 500 }]],
    ['/dashboard/admin/agents', [{ pct: 95, value: 500 }]],
    ['/dashboard/admin/recent', [{ pct: 95, value: 500 }]],
  ]);

  const thresholdFailures = assertThresholds(results, thresholds);
  failures.push(...thresholdFailures);

  // Check targets
  const apiEndpoints = results.filter(
    (r) => !r.endpoint.includes('dashboard') && !r.endpoint.includes('health'),
  );
  const dashEndpoints = results.filter((r) => r.endpoint.includes('dashboard'));

  const apiP95Fail = apiEndpoints.filter((r) => r.p95 > 200);
  const dashP95Fail = dashEndpoints.filter((r) => r.p95 > 500);

  if (apiP95Fail.length > 0) {
    console.log(`\n⚠ ${apiP95Fail.length} API endpoints exceed 200ms P95 target`);
    for (const r of apiP95Fail) {
      console.log(`   ${r.endpoint}: ${r.p95}ms`);
    }
  }
  if (dashP95Fail.length > 0) {
    console.log(`⚠ ${dashP95Fail.length} Dashboard endpoints exceed 500ms P95 target`);
    for (const r of dashP95Fail) {
      console.log(`   ${r.endpoint}: ${r.p95}ms`);
    }
  }
  if (apiP95Fail.length === 0 && dashP95Fail.length === 0) {
    console.log('\n✅ All endpoints meet performance targets!');
  }

  // Fail CI if any threshold exceeded
  if (failures.length > 0) {
    console.error('\n❌ Performance threshold failures:');
    for (const f of failures) {
      console.error(`  ${f}`);
    }
    if (CI_MODE) {
      process.exit(1);
    }
  } else {
    console.log('\n✅ All performance thresholds passed.');
  }
}

main().catch((err) => {
  console.error('Performance test runner failed:', err);
  process.exit(1);
});
