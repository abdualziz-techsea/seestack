interface ToggleProps {
  checked: boolean
  onChange?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

/**
 * RTL-aware toggle switch.
 * Uses CSS logical property `insetInlineStart` so the thumb correctly
 * sits at the "start" edge when OFF and "end" edge when ON, in both
 * LTR and RTL layouts.
 */
export function Toggle({ checked, onChange, disabled, size = 'sm' }: ToggleProps) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 20 : 24
  const thumbSize = 16
  const pad = size === 'sm' ? 2 : 4
  const checkedOffset = w - thumbSize - pad

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative shrink-0 rounded-full transition-colors disabled:opacity-40"
      style={{
        width: w,
        height: h,
        background: checked ? 'var(--primary)' : 'var(--bg-elevated)',
      }}
    >
      <div
        className="absolute top-[2px] rounded-full bg-white transition-all"
        style={{
          width: thumbSize,
          height: thumbSize,
          insetInlineStart: checked ? checkedOffset : pad,
        }}
      />
    </button>
  )
}
