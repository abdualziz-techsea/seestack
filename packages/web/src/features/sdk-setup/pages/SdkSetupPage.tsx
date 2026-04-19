import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { CodeBlock } from '../components/CodeBlock'

const LANGS = ['javascript', 'java', 'python'] as const
type Lang = (typeof LANGS)[number]

const LABEL: Record<Lang, string> = {
  javascript: 'JavaScript',
  java: 'Java',
  python: 'Python',
}

function snippets(endpoint: string, apiKey: string) {
  return {
    javascript: {
      install: `# Copy sdks/javascript/seestack-sdk.js into your project.
# The SDK is zero-dependency — no npm install required.`,
      init: `const { SeeStack } = require('./seestack-sdk')

const seestack = new SeeStack({
  apiKey: '${apiKey}',
  endpoint: '${endpoint}',
  environment: 'production',
})`,
      capture: `try {
  riskyWork()
} catch (err) {
  await seestack.captureException(err, {
    user: { id: 'user-42', email: 'alice@example.com' },
    metadata: { route: '/checkout' },
  })
}`,
    },
    java: {
      install: `// Drop sdks/java/SeeStack.java into your source tree.
// Uses only the JDK (java.net.http) — no external deps.`,
      init: `SeeStack seestack = new SeeStack(
    "${apiKey}",
    "${endpoint}",
    "production"
);`,
      capture: `try {
    riskyWork();
} catch (Exception e) {
    seestack.captureException(e);
}`,
    },
    python: {
      install: `# Copy sdks/python/seestack_sdk.py into your project.
# Standard-library only — no pip install required.`,
      init: `from seestack_sdk import SeeStack

seestack = SeeStack(
    api_key="${apiKey}",
    endpoint="${endpoint}",
    environment="production",
)`,
      capture: `try:
    risky_work()
except Exception as exc:
    seestack.capture_exception(exc,
        user={"id": "user-42", "email": "alice@example.com"},
        metadata={"route": "/checkout"})`,
    },
  }
}

export function SdkSetupPage() {
  const { projects, isLoading } = useProjects()
  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const [lang, setLang] = useState<Lang>('javascript')
  const endpoint = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8080') : 'http://localhost:8080'
  const apiKeyDisplay = currentProject?.apiKey ?? (currentProject?.apiKeyPrefix ? `${currentProject.apiKeyPrefix}_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` : 'ask_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  const code = useMemo(() => snippets(endpoint, apiKeyDisplay), [endpoint, apiKeyDisplay])

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
        SDK Setup
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        Drop a seeStack SDK into your app and start shipping errors to this project. Ingestion only
        needs the project’s <strong>ingest key</strong> — no user login, no identity provider.
      </p>

      {/* Project picker */}
      <div
        className="mt-5 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Project
        </div>
        {isLoading ? (
          <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            No projects yet.{' '}
            <Link to="/projects" style={{ color: 'var(--primary-text)' }}>
              Create one
            </Link>{' '}
            to see setup instructions.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => {
              const active = currentProject?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentProject(p)}
                  className="rounded-md px-3 py-1.5 text-[13px] font-medium"
                  style={{
                    background: active ? 'var(--primary-ghost)' : 'var(--bg-hover)',
                    color: active ? 'var(--primary-text)' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Ingest key
          </div>
          {currentProject?.apiKey ? (
            <>
              <CodeBlock code={currentProject.apiKey} />
              <p className="-mt-3 mb-4 text-[11px]" style={{ color: 'var(--warning)' }}>
                This is a one-time view. Copy it now — it will not be shown again.
              </p>
            </>
          ) : currentProject?.apiKeyPrefix ? (
            <p className="text-[13px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              {currentProject.apiKeyPrefix}… (hidden){' — '}
              <Link to="/projects" style={{ color: 'var(--primary-text)' }}>
                create a new project
              </Link>{' '}
              to issue a fresh key.
            </p>
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              Select a project above.
            </p>
          )}
        </div>
      </div>

      {/* Language tabs */}
      <div className="mt-8 mb-4 flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="px-3 py-2 text-[13px] font-medium"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${lang === l ? 'var(--primary)' : 'transparent'}`,
              color: lang === l ? 'var(--primary-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {LABEL[l]}
          </button>
        ))}
      </div>

      {/* Steps */}
      <Step title={`1. Install the seeStack ${LABEL[lang]} SDK`}>
        <CodeBlock language={lang === 'java' ? 'java' : 'shell'} code={code[lang].install} />
      </Step>
      <Step title="2. Initialise with your project ingest key">
        <CodeBlock language={lang} code={code[lang].init} />
      </Step>
      <Step title="3. Capture an exception">
        <CodeBlock language={lang} code={code[lang].capture} />
      </Step>

      <Step title="What happens next">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Every captured event is POSTed to{' '}
          <code className="font-mono" style={{ color: 'var(--text-primary)' }}>
            {endpoint}/ingest/v1/errors
          </code>{' '}
          with the header{' '}
          <code className="font-mono" style={{ color: 'var(--text-primary)' }}>X-SeeStack-Key</code>. Repeated
          occurrences of the same exception are grouped by a stable fingerprint and appear on the{' '}
          <Link to="/errors" style={{ color: 'var(--primary-text)' }}>Errors</Link> page.
        </p>
      </Step>
    </div>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-5 rounded-lg border p-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <h3 className="mb-2 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {children}
    </section>
  )
}
