import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@allstak/shared'
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward, AlertCircle, Globe, Terminal } from 'lucide-react'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useReplayData } from '../hooks/useReplayData'

export function ReplayPage() {
  const { fingerprint } = useParams()
  const { t } = useTranslation()
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const { events, duration, isLoading } = useReplayData(fingerprint)
  const maxTime = duration || 60

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= maxTime) { setPlaying(false); return maxTime }
        const errorEvent = events.find((e: any) => e.isError && Math.abs(e.time - t) < 0.5)
        if (errorEvent) { setPlaying(false); return t }
        return t + 0.1 * speed
      })
    }, 100)
    return () => clearInterval(interval)
  }, [playing, speed, maxTime, events])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Session Replay</h1>
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Session Replay</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Player */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden border" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-xl)' }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--warning)' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--success)' }} />
              </div>
              <div className="flex-1 rounded-md px-3 py-0.5 text-[11px] font-mono" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
                Session replay
              </div>
            </div>
            {/* Content area */}
            <div className="flex h-[400px] items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
              <div className="text-center">
                <Globe size={32} style={{ color: 'var(--text-tertiary)' }} />
                <p className="mt-2 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Replay at {currentTime.toFixed(1)}s</p>
              </div>
            </div>
            {/* Controls */}
            <div className="border-t p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              {/* Scrub bar */}
              <div className="relative mb-3 h-1.5 w-full cursor-pointer rounded-full" style={{ background: 'var(--bg-surface)' }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setCurrentTime((e.clientX - rect.left) / rect.width * maxTime) }}>
                <div className="h-full rounded-full" style={{ width: `${(currentTime / maxTime) * 100}%`, background: 'var(--primary)' }} />
                {events.filter((e: any) => e.isError).map((e: any, i: number) => (
                  <div key={i} className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded" style={{ left: `${(e.time / maxTime) * 100}%`, background: 'var(--danger)' }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentTime(0)} style={{ color: 'var(--text-secondary)' }}><SkipBack size={16} /></button>
                  <button onClick={() => setCurrentTime(Math.max(0, currentTime - 5))} style={{ color: 'var(--text-secondary)' }}><Rewind size={16} /></button>
                  <button onClick={() => setPlaying(!playing)} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setCurrentTime(Math.min(maxTime, currentTime + 5))} style={{ color: 'var(--text-secondary)' }}><FastForward size={16} /></button>
                  <button onClick={() => setCurrentTime(maxTime)} style={{ color: 'var(--text-secondary)' }}><SkipForward size={16} /></button>
                </div>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{currentTime.toFixed(1)}s / {maxTime}s</span>
                  <div className="flex gap-1">
                    {[0.5, 1, 2].map((s) => (
                      <button key={s} onClick={() => setSpeed(s)} className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: speed === s ? 'var(--primary-ghost)' : 'transparent', color: speed === s ? 'var(--primary-text)' : 'var(--text-tertiary)' }}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event timeline */}
        <div className="lg:col-span-2">
          <div className="border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Events</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {events.map((event: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentTime(event.time)}
                  className={cn('flex w-full items-start gap-3 border-b px-4 py-2.5 text-start transition-colors hover:bg-[var(--bg-hover)]')}
                  style={{
                    borderColor: 'var(--border)',
                    background: event.isError && Math.abs(currentTime - event.time) < 1 ? 'var(--danger-ghost)' : currentTime >= event.time - 0.5 && currentTime <= event.time + 0.5 ? 'var(--primary-ghost)' : undefined,
                  }}
                >
                  {event.isError ? (
                    <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />
                  ) : (
                    <Terminal size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px]" style={{ color: event.isError ? 'var(--danger)' : 'var(--text-primary)' }}>{event.description}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{event.time}s</div>
                  </div>
                </button>
              ))}
              {events.length === 0 && (
                <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noReplayEvents', { defaultValue: 'No replay events available' })}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
