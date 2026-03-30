interface LogoProps {
  size?: number
  showWordmark?: boolean
}

export function Logo({ size = 24, showWordmark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
        <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".3" />
      </svg>
      {showWordmark && (
        <span
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.012em' }}
        >
          AllStak
        </span>
      )}
    </div>
  )
}
