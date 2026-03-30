import { cn } from '@allstak/shared'

interface StackFrame {
  file: string
  line: number
  function: string
  isAppFrame: boolean
}

interface StackTraceViewerProps {
  frames: StackFrame[]
}

export function StackTraceViewer({ frames }: StackTraceViewerProps) {
  return (
    <div className="space-y-1">
      {frames.map((frame, i) => (
        <div
          key={i}
          className={cn('rounded-md px-3 py-2 font-mono text-[12px]')}
          style={{
            background: frame.isAppFrame ? 'var(--bg-elevated)' : 'transparent',
            color: frame.isAppFrame ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
        >
          <div>{frame.function}</div>
          <div className="text-[11px]" style={{ color: frame.isAppFrame ? 'var(--primary-text)' : 'var(--text-tertiary)' }}>
            {frame.file}:{frame.line}
          </div>
        </div>
      ))}
    </div>
  )
}
