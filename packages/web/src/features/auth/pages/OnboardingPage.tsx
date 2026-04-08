import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@seestack/shared'
import { Check, Copy, CheckCircle } from 'lucide-react'

const platforms = [
  { id: 'node', label: 'Node.js', icon: '\u2B21' },
  { id: 'java', label: 'Java', icon: '\u2615' },
  { id: 'python', label: 'Python', icon: '\uD83D\uDC0D' },
  { id: 'go', label: 'Go', icon: '\uD83D\uDD35' },
  { id: 'php', label: 'PHP', icon: '\uD83D\uDC18' },
  { id: 'ruby', label: 'Ruby', icon: '\uD83D\uDC8E' },
  { id: 'react-native', label: 'React Native', icon: '\u269B\uFE0F' },
  { id: 'vue', label: 'Vue', icon: '\uD83D\uDC9A' },
  { id: 'other', label: 'Other', icon: '\uD83D\uDCE6' },
]

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [workspace, setWorkspace] = useState({ name: '', slug: '', role: '', teamSize: '' })
  const [platform, setPlatform] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [eventReceived, setEventReceived] = useState(false)
  const [copied, setCopied] = useState(false)

  const progress = ((step + 1) / 4) * 100

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput])
      setEmailInput('')
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
      </div>
      <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Step {step + 1} of 4</div>

      {/* Step 0: Workspace */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Set up your workspace</h2>
          <div>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Workspace name</label>
            <input value={workspace.name} onChange={(e) => setWorkspace({ ...workspace, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>URL slug</label>
            <div className="flex items-center rounded-lg border text-[13px]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <span className="px-3" style={{ color: 'var(--text-tertiary)' }}>seestack.io/</span>
              <input value={workspace.slug} onChange={(e) => setWorkspace({ ...workspace, slug: e.target.value })} className="flex-1 bg-transparent px-1 py-2 outline-none" style={{ color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Team size</label>
            <div className="flex gap-2">
              {['1-5', '6-20', '21-50', '50+'].map((s) => (
                <button key={s} onClick={() => setWorkspace({ ...workspace, teamSize: s })} className="rounded-lg border px-4 py-2 text-[13px] transition-colors" style={{ borderColor: workspace.teamSize === s ? 'var(--primary)' : 'var(--border)', background: workspace.teamSize === s ? 'var(--primary-ghost)' : 'transparent', color: workspace.teamSize === s ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(1)} disabled={!workspace.name} className="w-full rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>Continue</button>
        </div>
      )}

      {/* Step 1: Platform */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Select your platform</h2>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className="flex flex-col items-center gap-2 rounded-lg border p-4 text-[13px] transition-colors" style={{ borderColor: platform === p.id ? 'var(--primary)' : 'var(--border)', background: platform === p.id ? 'var(--primary-ghost)' : 'transparent', color: platform === p.id ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                <span className="text-2xl">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Back</button>
            <button onClick={() => setStep(2)} disabled={!platform} className="flex-1 rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>Continue</button>
          </div>
        </div>
      )}

      {/* Step 2: Invite */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Invite your team</h2>
          <div>
            <div className="flex gap-2">
              <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail() } }} placeholder="colleague@company.com" className="flex-1 rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              <button onClick={handleAddEmail} className="rounded-lg px-4 py-2 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>{t('common.invite')}</button>
            </div>
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {emails.map((e) => (
                  <span key={e} className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    {e}
                    <button onClick={() => setEmails(emails.filter((x) => x !== e))} className="ml-1" style={{ color: 'var(--text-tertiary)' }}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Back</button>
            <button onClick={() => setStep(3)} className="flex-1 rounded-lg py-2.5 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>Continue</button>
          </div>
          <button onClick={() => setStep(3)} className="w-full text-center text-[13px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>Skip for now</button>
        </div>
      )}

      {/* Step 3: SDK */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Install the SDK</h2>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase" style={{ color: 'var(--text-tertiary)' }}>Your API Key</span>
              <button onClick={() => handleCopy('ask_live_xxxxxxxxxxxxxx')} style={{ color: copied ? 'var(--success)' : 'var(--text-tertiary)' }}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <code className="block text-[13px] font-mono" style={{ color: 'var(--primary-text)' }}>ask_live_xxxxxxxxxxxxxx</code>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <div className="mb-2 text-[11px] font-medium uppercase" style={{ color: 'var(--text-tertiary)' }}>Install</div>
            <code className="block text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>npm install @seestack/sdk</code>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <div className="mb-2 text-[11px] font-medium uppercase" style={{ color: 'var(--text-tertiary)' }}>Initialize</div>
            <pre className="text-[12px] font-mono" style={{ color: 'var(--text-primary)' }}>{`import SeeStack from '@seestack/sdk'\n\nSeeStack.init({\n  apiKey: 'ask_live_xxx',\n  environment: 'production'\n})`}</pre>
          </div>
          {eventReceived ? (
            <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>
              <Check size={16} /> Event received! You're all set.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg p-3 text-[13px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>
              <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--warning)' }} />
              Waiting for first event...
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Back</button>
            <button onClick={() => navigate('/overview')} className="flex-1 rounded-lg py-2.5 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>Go to dashboard</button>
          </div>
        </div>
      )}
    </div>
  )
}
