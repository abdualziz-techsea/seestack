import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={i} className="flex items-center gap-0">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--text-disabled)'}`,
                  background: done ? 'var(--success-ghost)' : active ? 'var(--primary-ghost)' : 'transparent',
                  color: done ? 'var(--success)' : active ? 'var(--primary-text)' : 'var(--text-disabled)',
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: done ? 'var(--success)' : active ? 'var(--primary-text)' : 'var(--text-disabled)' }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-3"
                style={{ width: 48, height: 2, background: done ? 'var(--success)' : 'var(--border-strong)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
