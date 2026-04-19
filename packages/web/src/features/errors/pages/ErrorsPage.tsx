import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useErrors } from '../hooks/useErrors'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import type { ErrorGroup } from '@seestack/shared'

function FilterGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden' }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 500,
            background: value === opt.value ? 'var(--primary-ghost)' : 'transparent',
            color: value === opt.value ? 'var(--primary-text)' : 'var(--text-secondary)',
            border: 'none',
            borderLeft: i > 0 ? '1px solid var(--border-strong)' : 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.12s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const envColor: Record<string, string> = {
  production: 'var(--danger)',
  staging: 'var(--warning)',
  development: 'var(--text-secondary)',
}

export function ErrorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [envFilter, setEnvFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { errors, isLoading } = useErrors({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    environment: envFilter !== 'all' ? envFilter : undefined,
  })

  const filtered = errors.filter((e: ErrorGroup) => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.exceptionClass.toLowerCase().includes(q) || (e.title ?? '').toLowerCase().includes(q)
  })

  const statusOptions = [
    { value: 'all', label: t('errors.all', { defaultValue: 'All' }) },
    { value: 'unresolved', label: t('errors.unresolved') },
    { value: 'resolved', label: t('errors.resolved') },
    { value: 'ignored', label: t('errors.ignored') },
  ]
  const envOptions = [
    { value: 'all', label: t('errors.allEnvs', { defaultValue: 'All Envs' }) },
    { value: 'production', label: t('common.production') },
    { value: 'staging', label: t('common.staging') },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>
          {t('errors.title', { defaultValue: 'Errors' })}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterGroup options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <FilterGroup options={envOptions} value={envFilter} onChange={setEnvFilter} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('errors.searchPlaceholder', { defaultValue: 'Search errors...' })}
          style={{
            height: 28,
            padding: '0 10px',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 12,
            outline: 'none',
            width: 200,
            marginLeft: 'auto',
          }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {[
              t('errors.statusCol', { defaultValue: 'Status' }),
              t('errors.errorCol', { defaultValue: 'Error' }),
              t('errors.envCol', { defaultValue: 'Env' }),
              t('errors.countCol', { defaultValue: 'Count' }),
              t('errors.lastSeenCol', { defaultValue: 'Last Seen' }),
            ].map((col) => (
              <th
                key={col}
                style={{
                  textAlign: 'left',
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  borderBottom: '1px solid var(--border-strong)',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={5} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  <SkeletonRow />
                </td>
              </tr>
            ))}
          {filtered.map((err: ErrorGroup) => (
            <tr
              key={err.fingerprint}
              onClick={() => navigate(`/errors/${err.fingerprint}`)}
              style={{ cursor: 'pointer', transition: 'background 0.08s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = ''
              }}
            >
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <StatusBadge status={err.status} />
              </td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{err.exceptionClass}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 1,
                    maxWidth: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {err.title}
                </div>
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  color: envColor[err.environment ?? ''] ?? 'var(--text-secondary)',
                }}
              >
                {err.environment ?? '—'}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
              >
                {err.occurrences}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}
              >
                <TimeAgo date={err.lastSeen} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isLoading && filtered.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          {t('empty.noErrors')}
        </div>
      )}
    </div>
  )
}
