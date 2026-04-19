"""
seeStack Python SDK — standard-library only.

Usage:
    from seestack_sdk import SeeStack
    seestack = SeeStack(api_key="ask_live_...", endpoint="http://localhost:8080",
                        environment="production")
    try:
        risky()
    except Exception as e:
        seestack.capture_exception(e)

Auth is the project ingest key (header: X-SeeStack-Key). No OAuth.
"""

from __future__ import annotations

import json
import os
import sys
import traceback
import urllib.request
import urllib.error


class SeeStack:
    def __init__(self, api_key: str, endpoint: str = "http://localhost:8080",
                 environment: str = "development", release: str | None = None):
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.endpoint = endpoint.rstrip("/")
        self.environment = environment
        self.release = release

    def capture_exception(self, exc: BaseException, *, level: str = "error",
                          environment: str | None = None, user: dict | None = None,
                          metadata: dict | None = None) -> tuple[int, str | None]:
        """POST the exception to /ingest/v1/errors. Returns (http_status, event_id)."""
        frames = [line.strip() for line in traceback.format_tb(exc.__traceback__) if line.strip()]
        body = {
            "exceptionClass": type(exc).__name__,
            "message": str(exc),
            "stackTrace": frames,
            "level": level,
            "environment": environment or self.environment,
            "release": self.release,
            "user": user,
            "metadata": metadata,
        }
        req = urllib.request.Request(
            f"{self.endpoint}/ingest/v1/errors",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-SeeStack-Key": self.api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                payload = json.loads(resp.read().decode("utf-8") or "null")
                event_id = (payload or {}).get("data", {}).get("id")
                return resp.status, event_id
        except urllib.error.HTTPError as e:
            return e.code, None


if __name__ == "__main__":
    key = os.environ.get("SEESTACK_API_KEY")
    endpoint = os.environ.get("SEESTACK_ENDPOINT", "http://localhost:8080")
    if not key:
        print("SEESTACK_API_KEY env var is required", file=sys.stderr)
        sys.exit(1)
    sdk = SeeStack(api_key=key, endpoint=endpoint, environment="production")
    try:
        raise ValueError("demo failure from seestack_sdk.py")
    except ValueError as e:
        status, event_id = sdk.capture_exception(e)
        print(f"sent ValueError status={status} event_id={event_id}")
