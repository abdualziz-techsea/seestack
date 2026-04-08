/**
 * AllStak JS SDK — E2E Test
 *
 * Tests spans, logs, HTTP requests, and error capture against localhost:8080.
 */

import { AllStak } from './dist/node/index.mjs';

const API_KEY = 'ask_live_4574x2yao33rtjbiuf2q873ltv6vpokb';
const BASE_URL = 'http://localhost:8080';

// DSN format: http://<apiKey>@<host>
const DSN = `http://${API_KEY}@localhost:8080`;

console.log('=== AllStak JS SDK E2E Test ===\n');
console.log(`DSN: ${DSN}`);

// --- Initialize ---
const client = AllStak.init({
  dsn: DSN,
  environment: 'e2e-testing',
  release: '0.1.0-e2e',
  tags: { service: 'sdk-js-test' },
});

AllStak.setUser({ id: 'e2e-user-1', email: 'e2e@test.com' });

console.log(`Session ID: ${AllStak.getSessionId()}`);

// --- Step 1: Create Spans ---
console.log('\n--- Step 1: Tracing (Spans) ---');

const rootSpan = AllStak.startSpan('HTTP GET /api/dashboard', {
  description: 'Handle dashboard API request',
  tags: { 'http.method': 'GET', 'http.route': '/api/dashboard' },
});

console.log(`Trace ID : ${rootSpan.traceId}`);
console.log(`Root Span: ${rootSpan.spanId} (operation: HTTP GET /api/dashboard)`);

// Simulate some work
await sleep(50);

// Child span
const childSpan = AllStak.startSpan('API fetch_metrics', {
  description: 'Fetch metrics from metrics service',
  tags: { 'service.target': 'metrics-service' },
});
console.log(`Child Span: ${childSpan.spanId} (operation: API fetch_metrics)`);

await sleep(30);

// Finish child first, then root
childSpan.finish('ok');
console.log('  -> child span finished');

await sleep(20);

rootSpan.finish('ok');
console.log('  -> root span finished');

// --- Step 2: Logs with trace context ---
console.log('\n--- Step 2: Logs ---');

// Start a new span so logs get trace context
const logSpan = AllStak.startSpan('log-context-span', {
  description: 'Span for log context',
});

AllStak.log.info('Dashboard loaded successfully', {
  service: 'sdk-js-test',
  userId: 'e2e-user-1',
  dashboard: 'main',
});
console.log('  -> sent info log');

AllStak.log.warn('Slow query detected in metrics fetch', {
  service: 'sdk-js-test',
  queryTime: 450,
});
console.log('  -> sent warn log');

AllStak.log.error('Failed to load widget data', {
  service: 'sdk-js-test',
  widget: 'revenue-chart',
  error: 'TIMEOUT',
});
console.log('  -> sent error log');

logSpan.finish('ok');

// --- Step 3: HTTP Request Records ---
console.log('\n--- Step 3: HTTP Requests ---');

AllStak.captureRequest({
  direction: 'inbound',
  method: 'GET',
  host: 'api.myapp.com',
  path: '/api/dashboard',
  statusCode: 200,
  durationMs: 142,
  requestSize: 0,
  responseSize: 8192,
  userId: 'e2e-user-1',
});
console.log('  -> captured GET /api/dashboard (200, 142ms)');

AllStak.captureRequest({
  direction: 'outbound',
  method: 'POST',
  host: 'metrics.internal',
  path: '/v1/query',
  statusCode: 200,
  durationMs: 89,
  requestSize: 256,
  responseSize: 4096,
});
console.log('  -> captured POST /v1/query (200, 89ms)');

AllStak.captureRequest({
  direction: 'inbound',
  method: 'GET',
  host: 'api.myapp.com',
  path: '/api/users/42',
  statusCode: 404,
  durationMs: 12,
  requestSize: 0,
  responseSize: 64,
  userId: 'e2e-user-1',
});
console.log('  -> captured GET /api/users/42 (404, 12ms)');

// --- Step 4: Capture an Error ---
console.log('\n--- Step 4: Error Capture ---');

const errSpan = AllStak.startSpan('error-context-span');
try {
  throw new Error('E2E test: NullPointerException in UserService.getProfile');
} catch (err) {
  AllStak.captureException(err, {
    service: 'sdk-js-test',
    module: 'user-service',
    action: 'getProfile',
  });
  console.log(`  -> captured error: ${err.message}`);
}
errSpan.finish('error');

// --- Step 5: Flush & Destroy ---
console.log('\n--- Step 5: Flushing ---');

// The SDK uses internal timers. Destroy triggers a final flush.
// Give a moment for any in-flight sends, then destroy.
await sleep(1000);
AllStak.destroy();
console.log('  -> SDK destroyed (final flush triggered)');

// Wait for network requests to complete
await sleep(2000);

// --- Summary ---
const traceId = rootSpan.traceId;
console.log('\n=== E2E Test Complete ===');
console.log(`Trace ID: ${traceId}`);
console.log('Sent:');
console.log('  - 3 spans (root + child + log-context)');
console.log('  - 3 logs (info, warn, error) with trace context');
console.log('  - 3 HTTP request records');
console.log('  - 1 captured error with trace context');

// --- Step 6: Verify in ClickHouse ---
console.log('\n--- Step 6: ClickHouse Verification ---');

try {
  const chQuery = `SELECT trace_id, operation, duration_ms, service, environment FROM allstak.spans WHERE service='sdk-js-test' ORDER BY start_time DESC LIMIT 10 FORMAT PrettyCompact`;
  const chRes = await fetch(`http://localhost:8123/?query=${encodeURIComponent(chQuery)}`);
  const chText = await chRes.text();
  if (chRes.ok && chText.trim().length > 0) {
    console.log('ClickHouse spans:\n' + chText);
  } else {
    console.log(`ClickHouse query status: ${chRes.status}`);
    console.log(chText || '(empty result — spans may not have been written yet)');
  }
} catch (err) {
  console.log(`ClickHouse not reachable: ${err.message}`);
}

try {
  const logQuery = `SELECT trace_id, level, message, service FROM allstak.logs WHERE service='sdk-js-test' ORDER BY timestamp DESC LIMIT 10 FORMAT PrettyCompact`;
  const logRes = await fetch(`http://localhost:8123/?query=${encodeURIComponent(logQuery)}`);
  const logText = await logRes.text();
  if (logRes.ok && logText.trim().length > 0) {
    console.log('ClickHouse logs:\n' + logText);
  } else {
    console.log(`ClickHouse logs query status: ${logRes.status}`);
    console.log(logText || '(empty result)');
  }
} catch (err) {
  console.log(`ClickHouse logs query failed: ${err.message}`);
}

console.log('\nDone.');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
