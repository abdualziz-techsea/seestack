interface LogMetadataExpandProps {
  metadata: Record<string, unknown>
  visible: boolean
}

export function LogMetadataExpand({ metadata, visible }: LogMetadataExpandProps) {
  if (!visible) return null

  return (
    <tr>
      <td
        colSpan={4}
        style={{
          padding: '0 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <pre
          style={{
            padding: '10px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            margin: '8px 0 10px',
            whiteSpace: 'pre',
            overflowX: 'auto',
            lineHeight: 1.7,
          }}
        >
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </td>
    </tr>
  )
}
