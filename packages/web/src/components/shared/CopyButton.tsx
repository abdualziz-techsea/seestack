import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@allstak/shared'
import { Copy, CheckCircle } from 'lucide-react'

interface CopyButtonProps {
  text: string
  size?: 'sm' | 'md'
}

export function CopyButton({ text, size = 'sm' }: CopyButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const iconSize = size === 'sm' ? 14 : 16
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <button
      onClick={handleCopy}
      className={cn('flex items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)]', btnSize)}
      style={{ color: copied ? 'var(--success)' : 'var(--text-tertiary)' }}
      aria-label={t('common.copy')}
    >
      {copied ? <CheckCircle size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  )
}
