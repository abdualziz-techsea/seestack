import { useTranslation } from 'react-i18next'
import { X, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LevelBadge } from '@/components/shared/LevelBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { StackTraceViewer } from './StackTraceViewer'
import { useErrorDetail } from '../hooks/useErrorDetail'

interface ErrorDetailSheetProps {
  fingerprint: string
  onClose: () => void
}

export function ErrorDetailSheet({ fingerprint, onClose }: ErrorDetailSheetProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { error: detail, isLoading } = useErrorDetail(fingerprint)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed bottom-0 end-0 top-0 z-50 flex w-[480px] flex-col overflow-y-auto border-s shadow-xl"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border)' }}
      >
        {isLoading || !detail ? (
          <div className="space-y-4 p-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{detail.exceptionClass}</h2>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-tertiary)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <button className="rounded-md px-3 py-1.5 text-[12px] font-medium" style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>{t('errors.resolve')}</button>
              <button className="rounded-md px-3 py-1.5 text-[12px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{t('errors.ignore')}</button>
              <button className="rounded-md px-3 py-1.5 text-[12px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{t('errors.assign')}</button>
              <button onClick={() => navigate(`/errors/${fingerprint}/replay`)} className="ms-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium" style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}>
                <Play size={12} /> {t('errors.watchReplay')}
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <StatusBadge status={detail.status} />
              <LevelBadge level={detail.level} />
              <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{detail.environment}</span>
              <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{detail.occurrences} {t('common.occurrences').toLowerCase()}</span>
            </div>

            {/* Message */}
            <div className="border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{detail.message}</p>
              <div className="mt-2 flex gap-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                <span>{t('common.firstSeen')}: <TimeAgo date={detail.firstSeen} /></span>
                <span>{t('common.lastSeen')}: <TimeAgo date={detail.lastSeen} /></span>
              </div>
            </div>

            {/* Stack trace */}
            {detail.stackTrace && (
              <div className="border-b p-4" style={{ borderColor: 'var(--border)' }}>
                <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('errors.stackTrace')}</h3>
                <StackTraceViewer frames={detail.stackTrace} />
              </div>
            )}

            {/* User context */}
            {detail.userContext && (
              <div className="p-4">
                <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('errors.userContext')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(detail.userContext).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{k}</div>
                      <div className="text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
