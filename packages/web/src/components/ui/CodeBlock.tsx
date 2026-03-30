import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {(language || showCopy) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>{language || ''}</span>
          {showCopy && (
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: copied ? 'var(--success)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: 'var(--text-2xs)',
                fontFamily: 'var(--font-sans)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                transition: 'all var(--duration-fast)',
                fontWeight: 500,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <pre style={{
        padding: '14px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-primary)',
        overflowX: 'auto',
        lineHeight: 1.65,
        margin: 0,
        whiteSpace: 'pre',
      }}>
        {code}
      </pre>
    </div>
  )
}
