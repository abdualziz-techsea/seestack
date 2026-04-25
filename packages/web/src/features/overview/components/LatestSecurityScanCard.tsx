import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { securityApi } from '@seestack/shared'
import { TimeAgo } from '@/components/shared/TimeAgo'

export function LatestSecurityScanCard() {
  const query = useQuery({
    queryKey: ['latest-security-scan'],
    queryFn: () => securityApi.list(1, 1).then((r) => r.data),
  })

  const latest = query.data?.items?.[0]

  return (
    <div className="rounded-xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: 'var(--border)' }}>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Latest security scan
        </span>
        <Link to="/security-scan" className="text-[11px]"
          style={{ color: 'var(--primary-text)', textDecoration: 'none' }}>
          View all →
        </Link>
      </div>
      <div className="px-4 py-3">
        {query.isLoading ? (
          <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
        ) : !latest ? (
          <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            No scans yet. Run a <Link to="/security-scan" style={{ color: 'var(--primary-text)' }}>Basic Port Exposure Check</Link>.
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              {latest.status === 'failed'
                ? <ShieldAlert size={14} style={{ color: 'var(--danger)' }} />
                : <ShieldCheck size={14} style={{ color: 'var(--success)' }} />}
              <span className="font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>
                {latest.target}
              </span>
            </div>
            <div className="mt-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {latest.openPorts.length} open / {latest.closedPorts.length} closed · <TimeAgo date={latest.createdAt} />
            </div>
            {latest.openPorts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {latest.openPorts.map((p) => (
                  <span key={p} className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
