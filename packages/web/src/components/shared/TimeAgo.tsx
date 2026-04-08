import { useState, useEffect } from 'react'
import { timeAgo, formatTimestamp } from '@seestack/shared'
import { useUIStore } from '@/store/ui.store'

interface TimeAgoProps {
  date: string
}

export function TimeAgo({ date }: TimeAgoProps) {
  const lang = useUIStore((s) => s.lang)
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span title={formatTimestamp(date)} style={{ color: 'var(--text-secondary)' }}>
      {timeAgo(date, lang)}
    </span>
  )
}
