import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sshApi } from '@seestack/shared'
import type { SshServer } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'
import { useSshServers } from '../hooks/useSshServers'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { TimeAgo } from '@/components/shared/TimeAgo'

function ActionBtn({ label, onClick, primary, danger }: { label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        height: 26, padding: '0 8px',
        border: primary ? '1px solid var(--primary-border)' : '1px solid var(--border-strong)',
        borderRadius: 4,
        background: primary ? 'var(--primary-ghost)' : 'transparent',
        color: primary ? 'var(--primary-text)' : 'var(--text-secondary)',
        fontFamily: 'inherit', fontSize: 11, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (danger) { e.currentTarget.style.background = 'var(--danger-ghost)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(229,72,77,0.25)' }
        else if (primary) { e.currentTarget.style.background = 'var(--primary-ghost-hover)' }
        else { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = primary ? 'var(--primary-ghost)' : 'transparent'
        e.currentTarget.style.color = primary ? 'var(--primary-text)' : 'var(--text-secondary)'
        e.currentTarget.style.borderColor = primary ? 'var(--primary-border)' : 'var(--border-strong)'
      }}
    >
      {label}
    </button>
  )
}

export function SSHPage() {
  const { t } = useTranslation()
  const [showCreate, setShowCreate] = useState(false)
  const [terminalServer, setTerminalServer] = useState<SshServer | null>(null)
  const { servers, isLoading } = useSshServers()
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (s: SshServer) => sshApi.delete(s.id, s.projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssh-servers', currentProject?.id] }),
  })

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>
          {t('ssh.title', { defaultValue: 'SSH Servers' })}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{ height: 32, padding: '0 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          + {t('ssh.addServer')}
        </button>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {[t('ssh.nameCol', { defaultValue: 'Name' }), t('ssh.hostCol', { defaultValue: 'Host' }), t('ssh.userCol', { defaultValue: 'User' }), t('ssh.createdCol', { defaultValue: 'Created' }), t('ssh.actionsCol', { defaultValue: 'Actions' })].map((col) => (
              <th key={col} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-strong)' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <tr key={i}><td colSpan={5} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}><SkeletonRow /></td></tr>
          ))}
          {servers.map((server: SshServer) => (
            <tr key={server.id} style={{ transition: 'background 0.08s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
            >
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13 }}>
                {server.name}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {server.host}:{server.port}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {server.username}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                <TimeAgo date={server.createdAt} />
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <ActionBtn label={t('ssh.openTerminal')} primary onClick={() => setTerminalServer(server)} />
                  <ActionBtn label={t('ssh.deleteAction', { defaultValue: 'Delete' })} danger onClick={() => deleteMutation.mutate(server)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!isLoading && servers.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          {t('empty.noServers')}
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateServerModal onClose={() => setShowCreate(false)} />}

      {/* Terminal modal */}
      {terminalServer && <TerminalOverlay server={terminalServer} onClose={() => setTerminalServer(null)} />}
    </div>
  )
}

/* ─── Create Server Modal ─── */

function CreateServerModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => sshApi.create({
      projectId: currentProject!.id,
      name, host, port: parseInt(port) || 22, username, privateKey,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssh-servers', currentProject?.id] })
      onClose()
    },
    onError: () => setError(t('ssh.createError', { defaultValue: 'Failed to create server' })),
  })

  const handleSubmit = () => {
    if (!name.trim() || !host.trim() || !username.trim() || !privateKey.trim()) {
      setError(t('ssh.validationRequired', { defaultValue: 'All fields are required' }))
      return
    }
    setError('')
    createMutation.mutate()
  }

  const fieldStyle = { width: '100%', height: 34, padding: '0 10px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 12, width: 480, maxWidth: '90vw', padding: 24, transform: 'scale(1)', opacity: 1, transition: 'transform 0.2s ease-out, opacity 0.2s ease-out' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>{t('ssh.addServer')}</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('ssh.serverName', { defaultValue: 'Server name' })}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="prod-server-1" style={fieldStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('ssh.hostLabel', { defaultValue: 'Host / IP' })}</label>
              <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.10" style={fieldStyle} />
            </div>
            <div style={{ width: 80 }}>
              <label style={labelStyle}>{t('ssh.portLabel', { defaultValue: 'Port' })}</label>
              <input value={port} onChange={(e) => setPort(e.target.value)} style={fieldStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('ssh.usernameLabel', { defaultValue: 'Username' })}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ubuntu" style={fieldStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('ssh.privateKeyLabel', { defaultValue: 'Private key (PEM)' })}</label>
            <textarea value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="-----BEGIN RSA PRIVATE KEY-----" rows={4} style={{ ...fieldStyle, height: 'auto', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }} />
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={onClose} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{t('common.cancel')}</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending} style={{ height: 32, padding: '0 14px', background: 'var(--primary)', border: 'none', borderRadius: 6, color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: createMutation.isPending ? 0.6 : 1 }}>
              {createMutation.isPending ? t('common.creating', { defaultValue: 'Creating...' }) : t('ssh.addServer')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Terminal Overlay ─── */

function TerminalOverlay({ server, onClose }: { server: SshServer; onClose: () => void }) {
  const { t } = useTranslation()
  const currentProject = useAuthStore((s) => s.currentProject)
  const termBodyRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentProject?.id) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ssh/terminal?serverId=${server.id}&projectId=${currentProject.id}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => { setConnected(true); setError('') }
    ws.onmessage = (e) => {
      setOutput((prev) => [...prev, e.data])
      if (termBodyRef.current) termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => { setError(t('ssh.connectionFailed', { defaultValue: 'Connection failed' })); setConnected(false) }

    return () => { ws.close(); wsRef.current = null }
  }, [server.id, currentProject?.id, t])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (e.key === 'Enter') wsRef.current.send('\r')
    else if (e.key === 'Backspace') wsRef.current.send('\x7f')
    else if (e.key.length === 1) wsRef.current.send(e.key)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#0a0b0d', zIndex: 100, display: 'flex', flexDirection: 'column' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div style={{ height: 44, background: '#111214', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#f7f8f8', display: 'flex', alignItems: 'center', gap: 8 }}>
          {server.username}@{server.host} ({server.name})
        </span>
        {connected && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500, color: '#3ecf8e', marginLeft: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e' }} />
            {t('ssh.connected')}
          </span>
        )}
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 4, color: '#8a8f98', fontFamily: 'inherit', fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ✕ {t('ssh.closeTerminal', { defaultValue: 'Close' })}
        </button>
      </div>

      {/* Body */}
      <div
        ref={termBodyRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: '#c8cdd5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}
        {!connected && !error && <div style={{ color: '#8a8f98' }}>{t('ssh.connecting', { defaultValue: 'Connecting...' })}</div>}
        {output.map((line, i) => <span key={i}>{line}</span>)}
        {connected && <span style={{ display: 'inline-block', width: 7, height: 15, background: 'var(--primary)', verticalAlign: 'text-bottom', animation: 'blink-cursor .8s step-end infinite' }} />}
      </div>

      <style>{`@keyframes blink-cursor { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  )
}
