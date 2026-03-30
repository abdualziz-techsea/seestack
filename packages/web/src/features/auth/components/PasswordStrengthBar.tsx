import { useTranslation } from 'react-i18next'

function getStrength(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const colors = ['var(--danger)', 'var(--warning)', '#a3d977', 'var(--success)']

interface PasswordStrengthBarProps {
  password: string
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { t } = useTranslation()
  const strength = getStrength(password)
  if (!password) return null

  const labels = [
    t('auth.strengthWeak'),
    t('auth.strengthFair'),
    t('auth.strengthGood'),
    t('auth.strengthStrong'),
  ]

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors"
            style={{
              background: i <= strength ? colors[strength - 1] : 'var(--bg-active)',
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          className="mt-1 text-[11px]"
          style={{ color: colors[strength - 1] }}
        >
          {labels[strength - 1]}
        </p>
      )}
    </div>
  )
}
