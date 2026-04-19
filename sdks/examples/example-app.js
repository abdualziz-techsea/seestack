// Runnable example. Ships three real errors to a running seeStack backend.
//
// Usage:
//   SEESTACK_API_KEY=ask_live_your_key \
//   SEESTACK_ENDPOINT=http://localhost:8080 \
//     node sdks/examples/example-app.js

const { SeeStack } = require('../javascript/seestack-sdk')

const apiKey = process.env.SEESTACK_API_KEY
const endpoint = process.env.SEESTACK_ENDPOINT || 'http://localhost:8080'
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

;(async () => {
  // 1. Same error thrown twice -> should group into one issue.
  for (let i = 0; i < 2; i++) {
    try {
      await riskyWork()
    } catch (err) {
      const res = await seestack.captureException(err, {
        environment: 'production',
        user: { id: 'user-42', email: 'alice@example.com', ip: '127.0.0.1' },
        metadata: { attempt: i + 1 },
      })
      console.log(`[${i + 1}] sent TypeError:`, res.status, res.eventId)
    }
  }

  // 2. A distinct error -> second issue.
  try {
    JSON.parse('not-json')
  } catch (err) {
    const res = await seestack.captureException(err, {
      environment: 'staging',
      level: 'warning',
    })
    console.log(`[3] sent SyntaxError:`, res.status, res.eventId)
  }
})()
