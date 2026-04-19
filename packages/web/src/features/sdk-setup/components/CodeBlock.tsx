import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div
      className="relative mt-2 mb-4 rounded-md border"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
    >
      {language && (
        <div
          className="border-b px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
        >
          {language}
        </div>
      )}
      <pre
        className="overflow-auto font-mono text-[12px]"
        style={{ padding: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre' }}
      >
        {code}
      </pre>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        className="absolute end-2 top-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px]"
        style={{
          background: 'var(--bg-hover)',
          color: copied ? 'var(--success)' : 'var(--text-secondary)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
