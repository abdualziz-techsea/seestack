import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Key, Lock, AlertTriangle, Check, Upload } from 'lucide-react'
import { Button, Input, Textarea, PageHeader } from '@/components/ui'

export function CreateServerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [authType, setAuthType] = useState<'key' | 'password'>('key')
  const [sshKey, setSshKey] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [password, setPassword] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('ssh.nameRequired', { defaultValue: 'Server name is required' })
    if (!host.trim()) e.host = t('ssh.hostRequired', { defaultValue: 'Host is required' })
    if (!username.trim()) e.username = t('ssh.usernameRequired', { defaultValue: 'Username is required' })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const testConnection = () => {
    if (!validate()) return
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      setTesting(false)
      setTestResult('success')
    }, 1500)
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('/ssh')
    }, 1000)
  }

  return (
    <div className="animate-fade mx-auto max-w-2xl">
      <PageHeader
        title={t('ssh.addServer')}
        subtitle={t('ssh.addServerSubtitle', { defaultValue: 'Configure SSH access to your server' })}
        actions={
          <Button variant="ghost" onClick={() => navigate('/ssh')}>
            <ArrowLeft size={14} /> {t('common.back', { defaultValue: 'Back' })}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Server Details */}
        <div
          className="animate-in rounded-xl border p-5"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('ssh.serverDetails', { defaultValue: 'Server Details' })}
          </h3>
          <div className="space-y-4">
            <Input
              label={t('ssh.serverName', { defaultValue: 'Server name' })}
              placeholder="prod-api-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Input
                label={t('ssh.hostIP', { defaultValue: 'Host / IP address' })}
                placeholder="10.0.1.50"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                error={errors.host}
              />
              <Input
                label={t('ssh.port', { defaultValue: 'Port' })}
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <Input
              label={t('ssh.username', { defaultValue: 'Username' })}
              placeholder="deploy"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
            />
          </div>
        </div>

        {/* Authentication */}
        <div
          className="animate-in stagger-1 rounded-xl border p-5"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('ssh.authentication', { defaultValue: 'Authentication' })}
          </h3>

          {/* Auth type toggle */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setAuthType('key')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-all"
              style={{
                borderColor: authType === 'key' ? 'var(--primary)' : 'var(--border-strong)',
                background: authType === 'key' ? 'var(--primary-ghost)' : 'transparent',
                color: authType === 'key' ? 'var(--primary-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Key size={14} /> {t('ssh.sshKey', { defaultValue: 'SSH Key' })}
            </button>
            <button
              onClick={() => setAuthType('password')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-all"
              style={{
                borderColor: authType === 'password' ? 'var(--primary)' : 'var(--border-strong)',
                background: authType === 'password' ? 'var(--primary-ghost)' : 'transparent',
                color: authType === 'password' ? 'var(--primary-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Lock size={14} /> {t('ssh.passwordAuth', { defaultValue: 'Password' })}
            </button>
          </div>

          {authType === 'key' && (
            <div className="space-y-4">
              <Textarea
                label={t('ssh.privateKey', { defaultValue: 'Private key' })}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                value={sshKey}
                onChange={(e) => setSshKey(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              <div
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-tertiary)' }}
              >
                <Upload size={14} />
                {t('ssh.uploadKey', { defaultValue: 'or drag & drop your key file here' })}
              </div>
              <Input
                label={t('ssh.passphrase', { defaultValue: 'Passphrase (if key is encrypted)' })}
                type="password"
                placeholder="••••••••"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
          )}

          {authType === 'password' && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-2 rounded-md border p-2.5 text-xs font-medium"
                style={{ background: 'var(--warning-ghost)', borderColor: 'rgba(240,185,91,0.15)', color: 'var(--warning)' }}
              >
                <AlertTriangle size={14} />
                {t('ssh.passwordWarning', { defaultValue: 'SSH keys are recommended for better security' })}
              </div>
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Test & Submit */}
        <div className="animate-in stagger-2 space-y-4">
          {/* Test result */}
          {testResult === 'success' && (
            <div
              className="flex items-center gap-2.5 rounded-lg border p-3.5"
              style={{ background: 'var(--success-ghost)', borderColor: 'var(--success)' }}
            >
              <Check size={18} style={{ color: 'var(--success)' }} />
              <span className="text-[13px] font-medium" style={{ color: 'var(--success)' }}>
                {t('ssh.connectionSuccess', { defaultValue: 'Connection successful!' })}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={() => navigate('/ssh')}>
              {t('common.cancel')}
            </Button>
            <Button variant="secondary" onClick={testConnection} loading={testing}>
              {t('ssh.testConnection', { defaultValue: 'Test connection' })}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {t('ssh.addServer')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
