import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogs } from '../hooks/useLogs'
import { useLiveLogs } from '../hooks/useLiveLogs'
import { LogFilterBar, type LogFilters } from '../components/LogFilterBar'
import { LogsTable } from '../components/LogsTable'
import { LiveTailBar } from '../components/LiveTailBar'
import type { LogEntry } from '@seestack/shared'

/** Parse metadata from backend JSON string to object */
function parseMetadata(log: LogEntry): LogEntry {
  if (typeof log.metadata === 'string') {
    try {
      return { ...log, metadata: JSON.parse(log.metadata) }
    } catch {
      return { ...log, metadata: undefined }
    }
  }
  return log
}

export function LogsPage() {
  const { t } = useTranslation()

  const [filters, setFilters] = useState<LogFilters>({
    level: 'All',
    service: 'All',
    timeRange: '15m',
    search: '',
    isLive: false,
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [livePaused, setLivePaused] = useState(false)

  // Debounce search: only send API request after 400ms of no typing
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 400)
    return () => clearTimeout(debounceTimer.current)
  }, [filters.search])

  // Derive stable API params from filter state
  const apiLevel = filters.level === 'All' ? undefined : filters.level.toLowerCase()
  const apiService = filters.service === 'All' ? undefined : filters.service

  // Historical logs (REST API) — only fetched when NOT in live mode
  const { logs, isLoading } = useLogs({
    level: apiLevel,
    service: apiService,
    timeRange: filters.timeRange,
    search: debouncedSearch || undefined,
    perPage: 50,
  })

  // Live tail (WebSocket) — only connected when live mode is ON
  const { liveLogs, isConnected, clearLogs } = useLiveLogs({
    enabled: filters.isLive,
    paused: livePaused,
  })

  // Parse metadata strings from backend into objects
  const parsedHistorical = useMemo(() => logs.map(parseMetadata), [logs])

  // Apply client-side filters to live logs (backend WebSocket doesn't filter)
  const filteredLiveLogs = useMemo(() => {
    return liveLogs.filter((log) => {
      if (apiLevel && log.level !== apiLevel) return false
      if (apiService && log.service !== apiService) return false
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        if (
          !log.message.toLowerCase().includes(q) &&
          !(log.service && log.service.toLowerCase().includes(q))
        )
          return false
      }
      return true
    })
  }, [liveLogs, apiLevel, apiService, debouncedSearch])

  // Show live logs when in live mode, historical otherwise
  const displayLogs = filters.isLive ? filteredLiveLogs : parsedHistorical

  // Extract unique services from both historical and live data
  const services = useMemo(() => {
    const set = new Set<string>()
    const source = filters.isLive ? liveLogs : parsedHistorical
    source.forEach((log) => {
      if (log.service) set.add(log.service)
    })
    return Array.from(set).sort()
  }, [parsedHistorical, liveLogs, filters.isLive])

  const handleToggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    [],
  )

  const handleClearLogs = useCallback(() => {
    clearLogs()
    setExpandedId(null)
  }, [clearLogs])

  // Reset live state when toggling live tail off
  const handleFiltersChange = useCallback(
    (next: LogFilters) => {
      if (!next.isLive && filters.isLive) {
        // Turning off live tail — reset pause and clear buffer
        setLivePaused(false)
        clearLogs()
      }
      setFilters(next)
    },
    [filters.isLive, clearLogs],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Page header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.022em',
              color: 'var(--text-primary)',
            }}
          >
            {t('logs.title')}
          </h1>
        </div>

        {/* Filters */}
        <LogFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          services={services}
        />

        {/* Logs table */}
        <LogsTable
          logs={displayLogs}
          isLoading={!filters.isLive && isLoading}
          expandedId={expandedId}
          onToggleExpand={handleToggleExpand}
        />
      </div>

      {/* Live tail status bar */}
      <LiveTailBar
        visible={filters.isLive}
        isPaused={livePaused}
        isConnected={isConnected}
        logCount={filteredLiveLogs.length}
        onPauseToggle={() => setLivePaused(!livePaused)}
        onClear={handleClearLogs}
      />

      {/* Hover styles for log rows */}
      <style>{`
        .log-row:hover td {
          background: var(--bg-hover) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
