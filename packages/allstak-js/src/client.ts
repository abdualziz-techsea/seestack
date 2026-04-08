import { HttpTransport } from './transport/http';
import { ErrorModule } from './modules/errors';
import { LogModule, LogLevel } from './modules/logs';
import { SessionReplayModule } from './modules/session-replay';
import { HttpRequestModule, HttpRequestItem } from './modules/http-requests';
import { CronModule, HeartbeatOptions } from './modules/cron';
import { TracingModule, Span } from './modules/tracing';
import { instrumentFetch, instrumentConsole } from './modules/auto-breadcrumbs';
import { generateId } from './utils/uuid';

export interface AllStakConfig {
  dsn: string;
  environment?: string;
  release?: string;
  user?: { id?: string; email?: string };
  tags?: Record<string, string>;
  /** Enable automatic breadcrumbs for fetch, console.warn/error, and HTTP requests. Default: true */
  autoBreadcrumbs?: boolean;
  /** Maximum number of breadcrumbs to keep in the ring buffer. Default: 50 */
  maxBreadcrumbs?: number;
  sessionReplay?: {
    enabled?: boolean;
    maskAllInputs?: boolean;
    sampleRate?: number;
  };
}

interface ParsedDsn {
  baseUrl: string;
  apiKey: string;
}

function parseDsn(dsn: string): ParsedDsn {
  const url = new URL(dsn);
  const apiKey = url.username;
  url.username = '';
  const baseUrl = url.origin;
  return { baseUrl, apiKey };
}

export class AllStakClient {
  private transport: HttpTransport;
  private config: AllStakConfig;
  private errors: ErrorModule;
  private logs: LogModule;
  private httpRequests: HttpRequestModule;
  private cron: CronModule;
  private tracing: TracingModule;
  private sessionReplay: SessionReplayModule | null = null;
  private sessionId: string;

  constructor(config: AllStakConfig) {
    this.config = config;
    this.sessionId = generateId();
    const { baseUrl, apiKey } = parseDsn(config.dsn);
    this.transport = new HttpTransport(baseUrl, apiKey);

    this.errors = new ErrorModule(this.transport, this.config, this.sessionId);
    this.logs = new LogModule(this.transport, this.config);
    this.httpRequests = new HttpRequestModule(this.transport);
    this.cron = new CronModule(this.transport);
    this.tracing = new TracingModule(this.transport, {
      service: config.tags?.service,
      environment: config.environment,
    });

    if (
      typeof window !== 'undefined' &&
      config.sessionReplay?.enabled &&
      !this.isNodeBuild()
    ) {
      this.sessionReplay = new SessionReplayModule(
        this.transport,
        this.config,
        this.sessionId,
      );
    }

    // Wire automatic breadcrumb instrumentation
    if (config.autoBreadcrumbs !== false) {
      instrumentFetch((type, msg, level, data) => this.addBreadcrumb(type, msg, level, data));
      instrumentConsole((type, msg, level, data) => this.addBreadcrumb(type, msg, level, data));

      this.logs.setOnLogBreadcrumb((level, message) => {
        const bcLevel = level === 'warn' ? 'warn' : 'error';
        this.addBreadcrumb('log', message, bcLevel, { logLevel: level });
      });

      this.httpRequests.setOnCapture((item) => {
        this.addBreadcrumb(
          'http',
          `${item.method} ${item.path} -> ${item.statusCode}`,
          item.statusCode >= 400 ? 'error' : 'info',
          { method: item.method, path: item.path, statusCode: item.statusCode, durationMs: item.durationMs },
        );
      });
    }
  }

  private isNodeBuild(): boolean {
    return typeof globalThis.__ALLSTAK_NODE__ !== 'undefined';
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    const traceContext: Record<string, unknown> = {};
    const traceId = this.tracing.getTraceId();
    if (traceId) traceContext.traceId = traceId;
    const spanId = this.tracing.getCurrentSpanId();
    if (spanId) traceContext.spanId = spanId;
    this.errors.captureException(error, { ...traceContext, ...context });
  }

  addBreadcrumb(
    type: string,
    message: string,
    level?: string,
    data?: Record<string, unknown>,
  ): void {
    this.errors.addBreadcrumb(type, message, level, data);
  }

  clearBreadcrumbs(): void {
    this.errors.clearBreadcrumbs();
  }

  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  ): void {
    this.errors.captureMessage(message, level);
  }

  /**
   * Report an HTTP request (inbound or outbound).
   * Batches internally and flushes every 5s or when 20 items accumulate.
   * Automatically attaches current traceId if not already set on the item.
   */
  captureRequest(item: HttpRequestItem): void {
    if (!item.traceId) {
      item.traceId = this.tracing.getTraceId();
    }
    this.httpRequests.capture(item);
  }

  /**
   * Report a cron job execution.
   * The cron monitor slug must match one configured in the AllStak dashboard.
   */
  heartbeat(options: HeartbeatOptions): void {
    this.cron.heartbeat(options);
  }

  get log() {
    const withTrace = (meta?: Record<string, unknown>): Record<string, unknown> => {
      const enriched: Record<string, unknown> = { ...meta };
      if (!enriched.traceId) {
        const traceId = this.tracing.getTraceId();
        if (traceId) enriched.traceId = traceId;
      }
      if (!enriched.spanId) {
        const spanId = this.tracing.getCurrentSpanId();
        if (spanId) enriched.spanId = spanId;
      }
      return enriched;
    };

    return {
      debug: (message: string, meta?: Record<string, unknown>) =>
        this.logs.send('debug', message, withTrace(meta)),
      info: (message: string, meta?: Record<string, unknown>) =>
        this.logs.send('info', message, withTrace(meta)),
      warn: (message: string, meta?: Record<string, unknown>) =>
        this.logs.send('warn', message, withTrace(meta)),
      error: (message: string, meta?: Record<string, unknown>) =>
        this.logs.send('error', message, withTrace(meta)),
      fatal: (message: string, meta?: Record<string, unknown>) =>
        this.logs.send('fatal', message, withTrace(meta)),
    };
  }

  setUser(user: { id?: string; email?: string }): void {
    this.config.user = user;
  }

  setTag(key: string, value: string): void {
    if (!this.config.tags) this.config.tags = {};
    this.config.tags[key] = value;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // ------------------------------------------------------------------
  // Distributed Tracing
  // ------------------------------------------------------------------

  /**
   * Start a new span. Automatically parented to the current active span.
   * Call `span.finish()` when the operation completes.
   */
  startSpan(
    operation: string,
    options?: { description?: string; tags?: Record<string, string> },
  ): Span {
    return this.tracing.startSpan(operation, options);
  }

  /** Get the current trace ID (creates one if none exists). */
  getTraceId(): string {
    return this.tracing.getTraceId();
  }

  /** Set the trace ID explicitly (e.g. from an incoming request header). */
  setTraceId(traceId: string): void {
    this.tracing.setTraceId(traceId);
  }

  /** Get the current active span ID, or null if no span is active. */
  getCurrentSpanId(): string | null {
    return this.tracing.getCurrentSpanId();
  }

  /** Reset trace context (trace ID and span stack). */
  resetTrace(): void {
    this.tracing.resetTrace();
  }

  destroy(): void {
    this.tracing.destroy();
    this.errors.destroy();
    this.httpRequests.destroy();
    this.sessionReplay?.destroy();
  }
}

// Re-export for module consumers
export type { HttpRequestItem } from './modules/http-requests';
export type { HeartbeatOptions } from './modules/cron';
export type { LogLevel } from './modules/logs';
export type { SpanData } from './modules/tracing';
export { Span } from './modules/tracing';

declare global {
  // eslint-disable-next-line no-var
  var __ALLSTAK_NODE__: boolean | undefined;
}
