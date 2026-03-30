import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Copy, Check, AlertTriangle } from 'lucide-react'
import { Button, Input, Textarea, SelectPills, PlatformGrid, StepIndicator } from '@/components/ui'
import { CopyButton } from '@/components/shared/CopyButton'

const platforms = [
  { value: 'node', label: 'Node.js', icon: '⚙' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'go', label: 'Go', icon: '⚡' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'react-native', label: 'React Native', icon: '📱' },
  { value: 'vue', label: 'Vue.js', icon: '🍀' },
  { value: 'other', label: 'Other', icon: '✦' },
]

const environments = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
]

const installTabs = ['npm', 'yarn', 'pnpm']
const installCommands = ['npm install @allstak/sdk', 'yarn add @allstak/sdk', 'pnpm add @allstak/sdk']

const apiKey = 'ask_live_' + Math.random().toString(36).slice(2, 26)

export function CreateProjectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [env, setEnv] = useState('production')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState('')
  const [installTab, setInstallTab] = useState(0)
  const [initTab, setInitTab] = useState(0)
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [nameError, setNameError] = useState('')

  const steps = [
    { label: t('projects.stepInfo', { defaultValue: 'Project Info' }) },
    { label: t('projects.stepPlatform', { defaultValue: 'Platform' }) },
    { label: t('projects.stepSDK', { defaultValue: 'Install SDK' }) },
  ]

  const goNext = () => {
    if (step === 0) {
      if (!name.trim()) { setNameError(t('projects.nameRequired', { defaultValue: 'Project name is required' })); return }
      setNameError('')
    }
    setStep(step + 1)
  }

  const startVerify = () => {
    setVerifying(true)
    setTimeout(() => { setVerifying(false); setVerified(true) }, 2000)
  }

  return (
    <div className="animate-fade flex justify-center px-6 py-4">
      <div className="w-full max-w-[640px]">
        {/* Title */}
        <h1
          className="mb-1 text-center text-2xl font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.022em' }}
        >
          {t('projects.createProject')}
        </h1>
        <p className="mb-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          {t('projects.createSubtitle', { defaultValue: 'Set up a new project in 3 easy steps' })}
        </p>

        <StepIndicator steps={steps} currentStep={step} />

        {/* Step 1: Project Info */}
        {step === 0 && (
          <div className="animate-in space-y-5">
            <Input
              label={t('projects.name')}
              placeholder={t('projects.namePlaceholder', { defaultValue: 'My Awesome App' })}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError('') }}
              error={nameError}
            />
            <SelectPills
              label={t('common.environment')}
              options={environments.map((e) => ({ ...e, label: t(`common.${e.value}`, { defaultValue: e.label }) }))}
              value={env}
              onChange={setEnv}
            />
            <Textarea
              label={t('projects.descriptionOptional', { defaultValue: 'Description (optional)' })}
              placeholder={t('projects.descriptionPlaceholder', { defaultValue: 'What does this project do?' })}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="primary" onClick={goNext}>
                {t('common.next', { defaultValue: 'Next' })} <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Platform */}
        {step === 1 && (
          <div className="animate-in space-y-5">
            <PlatformGrid
              label={t('projects.selectPlatform', { defaultValue: 'Select your platform' })}
              options={platforms.map((p) => ({ ...p, label: p.value === 'other' ? t('projects.other', { defaultValue: 'Other' }) : p.label }))}
              value={platform}
              onChange={setPlatform}
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" onClick={() => setStep(0)}>
                <ArrowLeft size={14} /> {t('common.back', { defaultValue: 'Back' })}
              </Button>
              <Button variant="primary" onClick={goNext} disabled={!platform}>
                {t('common.next', { defaultValue: 'Next' })} <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: SDK Install */}
        {step === 2 && (
          <div className="animate-in space-y-5">
            {/* API Key */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('projects.yourApiKey', { defaultValue: 'Your API Key' })}
              </div>
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-3.5 font-mono text-xs"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--primary-text)', wordBreak: 'break-all' }}
              >
                <span>{apiKey}</span>
                <CopyButton text={apiKey} />
              </div>
            </div>

            {/* Warning */}
            <div
              className="flex items-center gap-2 rounded-md border p-2.5 text-xs font-medium"
              style={{ background: 'var(--warning-ghost)', borderColor: 'rgba(240,185,91,0.15)', color: 'var(--warning)' }}
            >
              <AlertTriangle size={14} />
              {t('projects.saveKeyWarning', { defaultValue: "Save this key now — you won't be able to see it again." })}
            </div>

            {/* Install tabs */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('projects.installSDK', { defaultValue: 'Install the SDK' })}
              </div>
              <div className="flex border-b" style={{ borderColor: 'var(--border-strong)' }}>
                {installTabs.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(i)}
                    className="transition-colors"
                    style={{
                      padding: '8px 14px', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                      color: installTab === i ? 'var(--primary-text)' : 'var(--text-tertiary)',
                      borderBottom: `2px solid ${installTab === i ? 'var(--primary)' : 'transparent'}`,
                      background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid',
                      borderBottomColor: installTab === i ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div
                className="rounded-b-lg border border-t-0 p-3.5 font-mono text-xs"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', lineHeight: 1.7 }}
              >
                {installCommands[installTab]}
              </div>
            </div>

            {/* Verification */}
            {!verified && !verifying && (
              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> {t('common.back', { defaultValue: 'Back' })}
                </Button>
                <Button variant="primary" onClick={startVerify}>
                  {t('projects.verify', { defaultValue: 'Verify connection' })}
                </Button>
              </div>
            )}
            {verifying && (
              <div
                className="flex items-center gap-2.5 rounded-lg border p-3.5"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <span className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--primary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {t('projects.verifying', { defaultValue: 'Waiting for first event...' })}
                </span>
              </div>
            )}
            {verified && (
              <>
                <div
                  className="flex items-center gap-2.5 rounded-lg border p-3.5"
                  style={{ background: 'var(--success-ghost)', borderColor: 'var(--success)' }}
                >
                  <Check size={18} style={{ color: 'var(--success)' }} />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--success)' }}>
                    {t('projects.verified', { defaultValue: 'Connected! Your project is ready.' })}
                  </span>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={() => navigate('/projects')}>
                    {t('projects.goToDashboard', { defaultValue: 'Go to dashboard' })} <ArrowRight size={14} />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
