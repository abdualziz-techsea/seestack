import Link from 'next/link';
import { BoxIcon, WebhookIcon, FileTextIcon } from 'lucide-react';
import { appName, siteDescription } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${appName} Docs — Observability for Your Applications`,
  description: siteDescription,
  openGraph: {
    title: `${appName} Docs — Observability for Your Applications`,
    description: siteDescription,
  },
  twitter: {
    title: `${appName} Docs — Observability for Your Applications`,
    description: siteDescription,
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 px-4">
      <h1 className="text-4xl font-bold mb-4">SeeStack Docs</h1>
      <p className="text-lg text-fd-muted-foreground mb-8 max-w-xl">
        Full-stack observability for your applications. Capture errors, logs,
        HTTP traffic, user sessions, cron jobs, and feature flags.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 max-w-2xl w-full">
        <Link
          href="/docs"
          className="group rounded-xl border border-fd-border p-6 text-left hover:border-fd-primary hover:bg-fd-accent/50 transition-all"
        >
          <BoxIcon className="size-8 mb-3 text-fd-primary" />
          <h2 className="text-xl font-semibold mb-2">SDK Documentation</h2>
          <p className="text-sm text-fd-muted-foreground">
            Installation guides, feature walkthroughs, and API reference for
            integrating SeeStack into your app.
          </p>
        </Link>
        <Link
          href="/docs/api"
          className="group rounded-xl border border-fd-border p-6 text-left hover:border-fd-primary hover:bg-fd-accent/50 transition-all"
        >
          <WebhookIcon className="size-8 mb-3 text-fd-primary" />
          <h2 className="text-xl font-semibold mb-2">REST API Reference</h2>
          <p className="text-sm text-fd-muted-foreground">
            Ingestion endpoint specs for errors, logs, HTTP requests, session
            replay, and cron heartbeats.
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
        {[
          { title: 'Error Tracking', href: '/docs/features/error-tracking', desc: 'Capture exceptions with stack traces and context' },
          { title: 'Log Ingestion', href: '/docs/features/log-ingestion', desc: 'Structured logs at five severity levels' },
          { title: 'HTTP Monitoring', href: '/docs/features/http-monitoring', desc: 'Track inbound and outbound HTTP requests' },
          { title: 'Session Replay', href: '/docs/features/session-replay', desc: 'Replay user sessions from the dashboard' },
          { title: 'Cron Monitoring', href: '/docs/features/cron-monitoring', desc: 'Heartbeat pings for scheduled jobs' },
          { title: 'Feature Flags', href: '/docs/features/feature-flags', desc: 'Remote flag evaluation with targeting' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-fd-border p-4 text-left hover:bg-fd-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-fd-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 max-w-2xl w-full">
        <h2 className="text-lg font-semibold mb-2">AI-Friendly Docs</h2>
        <p className="text-sm text-fd-muted-foreground mb-4">
          Access our full documentation in machine-readable formats for AI coding assistants and harness agents.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/llms.txt"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-fd-border p-4 text-left hover:border-fd-primary hover:bg-fd-accent/50 transition-all"
          >
            <FileTextIcon className="size-5 mb-2 text-fd-primary" />
            <h3 className="font-semibold mb-1">llms.txt</h3>
            <p className="text-sm text-fd-muted-foreground">
              Index of all documentation pages
            </p>
          </a>
          <a
            href="/llms-full.txt"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-fd-border p-4 text-left hover:border-fd-primary hover:bg-fd-accent/50 transition-all"
          >
            <FileTextIcon className="size-5 mb-2 text-fd-primary" />
            <h3 className="font-semibold mb-1">llms-full.txt</h3>
            <p className="text-sm text-fd-muted-foreground">
              Complete documentation in a single file
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
