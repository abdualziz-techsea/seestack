import { AllStak } from './dist/node/index.mjs';

const client = AllStak.init({
  dsn: 'http://ask_live_4574x2yao33rtjbiuf2q873ltv6vpokb@localhost:8080',
  environment: 'e2e-heavy',
  tags: { service: 'sdk-js-heavy-test' },
});

const traceIds = [];
let spanCount = 0;

// A) TRACING: 5 successful + 2 error traces
for (let i = 0; i < 5; i++) {
  AllStak.resetTrace();
  const root = AllStak.startSpan(`HTTP GET /api/widgets-${i}`, { description: `JS success flow ${i}` });
  traceIds.push(root.traceId);

  const dbSpan = AllStak.startSpan(`DB SELECT widgets_${i}`, { description: 'MySQL query' });
  await sleep(20);
  dbSpan.finish('ok');

  const cacheSpan = AllStak.startSpan(`CACHE GET widgets:${i}`, { description: 'Memcached lookup' });
  await sleep(5);
  cacheSpan.finish('ok');

  if (i % 2 === 0) {
    const extSpan = AllStak.startSpan(`gRPC inventory.Check`, { description: 'External gRPC call' });
    await sleep(15);
    extSpan.finish('ok');
    spanCount++;
  }

  root.finish('ok');
  spanCount += 3;
}

for (let i = 0; i < 2; i++) {
  AllStak.resetTrace();
  const root = AllStak.startSpan(`HTTP DELETE /api/widgets/0 (FAIL ${i})`, { description: 'Error flow' });
  traceIds.push(root.traceId);
  const child = AllStak.startSpan(`DB DELETE widgets (CONSTRAINT)`, { description: 'FK violation' });
  await sleep(10);
  child.finish('error');
  root.finish('error');
  spanCount += 2;
}

console.log(`Spans: ${spanCount}`);
console.log(`Traces: ${traceIds.length} unique`);

// B) LOGS: 17 mixed
const logEntries = [
  ['debug', 'Express router initialized'],
  ['debug', 'Middleware chain: auth -> validate -> handle'],
  ['info', 'Server listening on :3000'],
  ['info', 'Incoming request: GET /api/widgets'],
  ['info', 'Cache miss, querying database'],
  ['info', 'Query returned 128 widgets'],
  ['info', 'Response sent: 200 OK, 45KB'],
  ['warn', 'Event loop lag: 150ms'],
  ['warn', 'Memory heap: 85% used'],
  ['warn', 'Unhandled promise rejection caught'],
  ['error', 'ECONNREFUSED: Redis connection failed'],
  ['error', 'Timeout: upstream service /api/inventory'],
  ['error', 'JSON parse error in request body'],
  ['info', 'Background worker: email queue processed'],
  ['debug', 'GC pause: 12ms'],
  ['info', 'WebSocket upgrade: /ws/notifications'],
  ['warn', 'Deprecated: Buffer() constructor'],
];

let logCount = 0;
for (const [level, msg] of logEntries) {
  const tid = logCount < 10 ? traceIds[logCount % traceIds.length] : undefined;
  AllStak.log[level](msg, { service: 'sdk-js-heavy-test', traceId: tid });
  logCount++;
}
console.log(`Logs: ${logCount}`);

// C) HTTP REQUESTS: 12 mixed
const requests = [
  ['GET', '/api/widgets', 200, 95], ['GET', '/api/widgets/1', 200, 30],
  ['POST', '/api/widgets', 201, 220], ['PUT', '/api/widgets/1', 200, 110],
  ['DELETE', '/api/widgets/5', 204, 40], ['GET', '/api/dashboard', 200, 350],
  ['POST', '/api/auth/login', 200, 180], ['POST', '/api/uploads', 413, 50],
  ['GET', '/api/search?q=test', 200, 800], ['GET', '/api/health', 200, 2],
  ['PATCH', '/api/widgets/1', 200, 75], ['GET', '/api/metrics', 500, 1500],
];

let reqCount = 0;
for (const [method, path, status, dur] of requests) {
  AllStak.captureRequest({
    traceId: traceIds[reqCount % traceIds.length],
    direction: 'inbound',
    method,
    host: 'api.js-heavy.allstak.io',
    path,
    statusCode: status,
    durationMs: dur,
    requestSize: 100,
    responseSize: 500,
    timestamp: Date.now(),
  });
  reqCount++;
}
console.log(`Requests: ${reqCount}`);

// D) ERRORS: 3
let errCount = 0;
for (const [name, msg] of [
  ['TypeError', 'Cannot read properties of undefined'],
  ['RangeError', 'Maximum call stack size exceeded'],
  ['SyntaxError', 'Unexpected token < in JSON at position 0'],
]) {
  const err = new Error(msg);
  err.name = name;
  AllStak.captureException(err);
  errCount++;
}
console.log(`Errors: ${errCount}`);

// E) FAILURE: bad key test
try {
  const resp = await fetch('http://localhost:8080/ingest/v1/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AllStak-Key': 'bad_key_xxx' },
    body: JSON.stringify({ level: 'info', message: 'bad key' }),
  });
  console.log(`Bad key test: HTTP ${resp.status} (expected 401)`);
} catch (e) {
  console.log(`Bad key test: ${e.message}`);
}

// Flush and exit — destroy triggers flush, then wait for network
AllStak.destroy();
await sleep(8000); // Wait longer for all batches to flush via network
console.log(`\n=== JS SDK DONE ===`);
console.log(`Trace IDs: ${traceIds.slice(0, 3).join(', ')}...`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
