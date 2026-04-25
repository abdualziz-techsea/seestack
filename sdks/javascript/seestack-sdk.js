// seeStack JavaScript SDK — zero dependencies.
// Sends application errors to a seeStack backend.
//
// Usage:
//   const { SeeStack } = require('./seestack-sdk')
//   const seestack = new SeeStack({
//     apiKey: 'ask_live_...',
//     endpoint: 'http://localhost:8082',
//     environment: 'production',
//   })
//   seestack.captureException(err)
//
// Auth: only the project ingest key (header: X-SeeStack-Key).
// No OAuth. No user JWT. No external identity provider.

class SeeStack {
  constructor({ apiKey, endpoint = 'http://localhost:8082', environment = 'development', release = null }) {
    if (!apiKey) throw new Error('SeeStack: apiKey is required')
    this.apiKey = apiKey
    this.endpoint = endpoint.replace(/\/$/, '')
    this.environment = environment
    this.release = release
  }

  /**
   * Send an error event to /ingest/v1/errors.
   * Returns { ok, status, eventId, raw }.
   */
  async captureException(err, meta = {}) {
    const stack = (err && err.stack ? err.stack : '')
      .split('\n')
      .slice(1)
      .map((s) => s.trim())
      .filter(Boolean)

    const body = {
      exceptionClass: (err && err.name) || 'Error',
      message: (err && err.message) || String(err),
      stackTrace: stack,
      level: meta.level || 'error',
      environment: meta.environment || this.environment,
      release: meta.release || this.release,
      user: meta.user || null,
      metadata: meta.metadata || null,
    }

    const res = await fetch(`${this.endpoint}/ingest/v1/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SeeStack-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch { /* noop */ }
    return {
      ok: res.ok,
      status: res.status,
      eventId: parsed?.data?.id ?? null,
      raw: parsed ?? text,
    }
  }
}

module.exports = { SeeStack }
