# seeStack SDKs

Tiny, zero-dependency client libraries for shipping errors from an
application into seeStack.

All SDKs use the same public ingest endpoint:

```
POST {endpoint}/ingest/v1/errors
Header:  X-SeeStack-Key: <your project ingest key>
Body:    { exceptionClass, message, stackTrace[], level, environment, release?, user?, metadata? }
```

Auth on the ingest path is **only** the project ingest key (the
`ask_live_…` / `ask_test_…` string shown once when you create a
project in the dashboard). No user login, no identity provider, no
organization context.

## SDKs

| Language   | File                                                 | Status     |
| ---------- | ---------------------------------------------------- | ---------- |
| JavaScript | [`javascript/seestack-sdk.js`](javascript/seestack-sdk.js) | Production-ready |
| Java       | [`java/SeeStack.java`](java/SeeStack.java)           | Basic, runnable  |
| Python     | [`python/seestack_sdk.py`](python/seestack_sdk.py)   | Basic, runnable  |

## Run the JS example

```bash
SEESTACK_API_KEY=ask_live_your_key \
SEESTACK_ENDPOINT=http://localhost:8082 \
  node sdks/examples/example-app.js
```

The example raises two identical errors (to exercise fingerprint
grouping) plus one distinct error and sends all three to
`/ingest/v1/errors`. They should immediately appear in the dashboard
under **Errors**.
