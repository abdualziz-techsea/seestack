// Runnable example. Ships several real errors to a running seeStack backend.
//
// Usage:
//   SEESTACK_API_KEY=ask_live_your_key \
//   SEESTACK_ENDPOINT=http://localhost:8082 \
//     node sdks/examples/example-app.js

const { SeeStack } = require('../javascript/seestack-sdk')
const fs = require('node:fs/promises')

const apiKey = process.env.SEESTACK_API_KEY
const endpoint = process.env.SEESTACK_ENDPOINT || 'http://localhost:8082'
if (!apiKey) {
  console.error('SEESTACK_API_KEY env var is required')
  process.exit(1)
}

const seestack = new SeeStack({
  apiKey,
  endpoint,
  environment: 'production',
  release: '1.0.0',
})

async function riskyWork() {
  // Intentionally trigger a real runtime error.
  const user = null
  return user.name.toUpperCase()
}

function parseWebhookPayload() {
  return JSON.parse('not-json')
}

function allocateInvalidBatch() {
  return new Array(-1)
}

function renderMissingTemplate() {
  return missingTemplateRenderer('checkout-confirmation')
}

async function readMissingConfig() {
  return fs.readFile('/tmp/seestack-demo/missing-config.json', 'utf8')
}

function chargePaymentMethod() {
  const err = new Error('Payment provider declined card authorization')
  err.name = 'PaymentGatewayError'
  throw err
}

async function sendExample(label, work, meta = {}) {
  try {
    await work()
  } catch (err) {
    const res = await seestack.captureException(err, meta)
    console.log(`${label} sent ${err.name}:`, res.status, res.eventId)
  }
}

;(async () => {
  // 1. Same error thrown twice -> should group into one issue.
  for (let i = 0; i < 2; i++) {
    await sendExample(
      `[${i + 1}]`,
      riskyWork,
      {
        environment: 'production',
        user: { id: 'user-42', email: 'alice@example.com', ip: '127.0.0.1' },
        metadata: {
          attempt: i + 1,
          route: '/api/account/profile',
          component: 'AccountHeader',
        },
      }
    )
  }

  // 2. A distinct error -> second issue.
  await sendExample('[3]', parseWebhookPayload, {
    environment: 'staging',
    level: 'warning',
    metadata: {
      route: '/webhooks/stripe',
      payloadSizeBytes: 8,
      provider: 'stripe',
    },
  })

  // 3. Invalid batch sizing -> RangeError.
  await sendExample('[4]', allocateInvalidBatch, {
    environment: 'production',
    level: 'error',
    metadata: {
      job: 'billing-rollup',
      batchSize: -1,
      queue: 'invoices',
    },
  })

  // 4. Missing symbol in a render path -> ReferenceError.
  await sendExample('[5]', renderMissingTemplate, {
    environment: 'production',
    level: 'error',
    user: { id: 'user-77', email: 'samira@example.com', ip: '10.0.0.24' },
    metadata: {
      route: '/checkout/success',
      template: 'checkout-confirmation',
      tenant: 'acme',
    },
  })

  // 5. Missing local config file -> filesystem Error with ENOENT details.
  await sendExample('[6]', readMissingConfig, {
    environment: 'development',
    level: 'warning',
    metadata: {
      service: 'worker',
      configPath: '/tmp/seestack-demo/missing-config.json',
    },
  })

  // 6. Custom domain error -> fatal payment issue.
  await sendExample('[7]', chargePaymentMethod, {
    environment: 'production',
    level: 'fatal',
    user: { id: 'user-108', email: 'omar@example.com', ip: '10.0.0.58' },
    metadata: {
      route: '/api/payments/charge',
      provider: 'demo-pay',
      orderId: 'ord_demo_1001',
      amountCents: 12900,
    },
  })

  // 7. Same payment failure again -> should group with example [7].
  await sendExample('[8]', chargePaymentMethod, {
    environment: 'production',
    level: 'fatal',
    user: { id: 'user-109', email: 'noura@example.com', ip: '10.0.0.59' },
    metadata: {
      route: '/api/payments/charge',
      provider: 'demo-pay',
      orderId: 'ord_demo_1002',
      amountCents: 45900,
    },
  })

  console.log('Done. Refresh the Errors dashboard to see grouped and distinct issues.')
})()
