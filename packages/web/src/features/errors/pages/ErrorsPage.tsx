import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useErrors } from '../hooks/useErrors'
import { useErrorDetail } from '../hooks/useErrorDetail'
import { useUpdateErrorStatus } from '../hooks/useUpdateErrorStatus'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { X } from 'lucide-react'
import type { ErrorGroup, ErrorStatus } from '@seestack/shared'

function FilterGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden' }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 10px', fontSize: 12, fontWeight: 500,
            background: value === opt.value ? 'var(--primary-ghost)' : 'transparent',
            color: value === opt.value ? 'var(--primary-text)' : 'var(--text-secondary)',
            border: 'none', borderLeft: i > 0 ? '1px solid var(--border-strong)' : 'none',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
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
  const [statusFilter, setStatusFilter] = useState('all')
  const [envFilter, setEnvFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedFp, setSelectedFp] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { errors, isLoading } = useErrors({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    environment: envFilter !== 'all' ? envFilter : undefined,
  })

  const { error: detail, isLoading: detailLoading } = useErrorDetail(selectedFp ?? undefined)
  const { updateStatus } = useUpdateErrorStatus()

  const filtered = errors.filter((e: ErrorGroup) => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.exceptionClass.toLowerCase().includes(q) || (e.title ?? '').toLowerCase().includes(q)
  })

  const toggleSelect = useCallback((fp: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(fp) ? next.delete(fp) : next.add(fp)
      return next
    })
  }, [])

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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>
            {t('errors.title', { defaultValue: 'Errors' })}
          </h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterGroup options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          <FilterGroup options={envOptions} value={envFilter} onChange={setEnvFilter} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('errors.searchPlaceholder', { defaultValue: 'Search errors...' })}
            style={{
              height: 28, padding: '0 10px', background: 'var(--bg-raised)',
              border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: 12, outline: 'none', width: 200, marginLeft: 'auto',
            }}
          />
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 32, padding: '6px 12px', borderBottom: '1px solid var(--border-strong)' }}>
                <input type="checkbox" style={{ width: 14, height: 14, cursor: 'pointer' }} />
              </th>
              {[t('errors.statusCol', { defaultValue: 'Status' }), t('errors.errorCol', { defaultValue: 'Error' }), t('errors.envCol', { defaultValue: 'Env' }), t('errors.countCol', { defaultValue: 'Count' }), t('errors.lastSeenCol', { defaultValue: 'Last Seen' })].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-strong)' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={6} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}><SkeletonRow /></td></tr>
            ))}
            {filtered.map((err: ErrorGroup) => (
              <tr
                key={err.fingerprint}
                onClick={() => setSelectedFp(err.fingerprint)}
                style={{
                  cursor: 'pointer', transition: 'background 0.08s',
                  background: selectedFp === err.fingerprint ? 'var(--primary-ghost)' : undefined,
                }}
                onMouseEnter={(e) => { if (selectedFp !== err.fingerprint) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { if (selectedFp !== err.fingerprint) e.currentTarget.style.background = '' }}
              >
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(err.fingerprint)} onChange={() => toggleSelect(err.fingerprint)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  <StatusBadge status={err.status} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{err.exceptionClass}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 1, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.title}</div>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: envColor[err.environment ?? ''] ?? 'var(--text-secondary)' }}>
                  {err.environment ?? '—'}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {err.occurrences}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
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

      {/* Detail panel */}
      <div
        style={{
          width: selectedFp ? 480 : 0,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          flexShrink: 0,
          overflowY: 'auto',
          transition: 'width 0.2s ease',
          opacity: selectedFp ? 1 : 0,
        }}
      >
        {selectedFp && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.012em' }}>
                {detail?.exceptionClass ?? '...'}
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {detail && (
                  <>
                    <DetailBtn label={`✓ ${t('errors.resolve')}`} onClick={() => updateStatus({ fingerprint: selectedFp, status: 'resolved' as ErrorStatus })} />
                    <DetailBtn label={`🚫 ${t('errors.ignore')}`} onClick={() => updateStatus({ fingerprint: selectedFp, status: 'ignored' as ErrorStatus })} />
                  </>
                )}
                <button onClick={() => setSelectedFp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 16, cursor: 'pointer', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ padding: 16 }}><SkeletonRow /><div style={{ marginTop: 12 }}><SkeletonRow /></div></div>
            ) : detail ? (
              <div style={{ padding: 16 }}>
                {/* Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                  <StatusBadge status={detail.status} />
                  {detail.environment && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--danger-ghost)', color: 'var(--danger)' }}>{detail.environment}</span>
                  )}
                  {detail.level && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--danger-ghost)', color: 'var(--danger)' }}>{detail.level}</span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>{detail.occurrences} {t('common.occurrences').toLowerCase()}</span>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{detail.title}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span>{t('common.firstSeen')}: <TimeAgo date={detail.firstSeen} /></span>
                    <span>{t('common.lastSeen')}: <TimeAgo date={detail.lastSeen} /></span>
                  </div>
                </div>

                {/* Stack trace */}
                {detail.stackTrace && detail.stackTrace.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: 8 }}>{t('errors.stackTrace')}</div>
                    <pre style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', overflowX: 'auto', maxHeight: 220, overflowY: 'auto', lineHeight: 1.7, whiteSpace: 'pre' }}>
                      {detail.stackTrace.map((f) => `  at ${f.function} (${f.file}:${f.line})`).join('\n')}
                    </pre>
                  </div>
                )}

                {/* User context */}
                {detail.userContext && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: 8 }}>{t('errors.userContext')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Object.entries(detail.userContext).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 1 }}>{k}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: '1px solid var(--border)', padding: '8px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: 'var(--bg-overlay)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{selected.size} {t('errors.selected', { defaultValue: 'selected' })}</span>
          <button style={{ borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, background: 'var(--success-ghost)', color: 'var(--success)', border: 'none', cursor: 'pointer' }}>{t('errors.resolve')}</button>
          <button style={{ borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>{t('errors.ignore')}</button>
        </div>
      )}
    </div>
  )
}

function DetailBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ height: 28, padding: '0 10px', border: '1px solid var(--border-strong)', borderRadius: 4, background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {label}
    </button>
  )
}
