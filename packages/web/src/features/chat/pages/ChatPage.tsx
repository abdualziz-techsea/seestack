import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { cn, chatApi } from '@seestack/shared'
import { Hash, Send, X, Users, MessageSquare, Search, Pin, Plus, Trash2, Edit2, Smile } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/store/auth.store'
import { useChannels } from '../hooks/useChannels'
import { useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import { useChatSocket } from '../hooks/useChatSocket'
import { useMessageActions } from '../hooks/useMessageActions'
import { usePinnedMessages } from '../hooks/usePinnedMessages'
import { useChatSearch } from '../hooks/useChatSearch'
import type { ChatChannel, ChatMessage, MessageReaction } from '@seestack/shared'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👀', '✅', '🚀']

function getDateLabel(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return t('chat.today')
  if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday')
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function shouldShowDateDivider(current: ChatMessage, previous?: ChatMessage): boolean {
  if (!previous) return true
  return new Date(current.createdAt).toDateString() !== new Date(previous.createdAt).toDateString()
}

interface ReactionBarProps {
  reactions: MessageReaction[]
  currentUserId: string
  onToggle: (emoji: string, hasReacted: boolean) => void
}

function ReactionBar({ reactions, currentUserId, onToggle }: ReactionBarProps) {
  if (!reactions || reactions.length === 0) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1 ps-[46px]">
      {reactions.map((r) => {
        const hasReacted = r.userIds?.includes(currentUserId) ?? false
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji, hasReacted)}
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              borderColor: hasReacted ? 'var(--primary)' : 'var(--border)',
              background: hasReacted ? 'var(--primary-ghost)' : 'var(--bg-elevated)',
              color: 'var(--text-primary)',
            }}
          >
            <span>{r.emoji}</span>
            <span className="font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>{r.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ChatPage() {
  const { t } = useTranslation()
  const [activeChannel, setActiveChannel] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentProject = useAuthStore((s) => s.currentProject)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  // Channel management
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  // Message actions
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Search
  const [showSearch, setShowSearch] = useState(false)
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, isSearching } =
    useChatSearch(currentProject?.orgId)

  // Pinned messages panel
  const [showPinned, setShowPinned] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const { channels, isLoading: channelsLoading, error: channelsError, refetch: refetchChannels } = useChannels()
  const { messages: messageList, isLoading: messagesLoading, error: messagesError } = useMessages(activeChannel)
  const { sendMessage, isSending, error: sendError } = useSendMessage()
  useChatSocket(activeChannel)

  const { editMessage, deleteMessage, toggleReaction, togglePin } = useMessageActions(activeChannel)
  const { pinnedMessages, isLoading: pinnedLoading } = usePinnedMessages(showPinned ? activeChannel : undefined)

  // Channel mutations
  const createChannelMutation = useMutation({
    mutationFn: (name: string) => chatApi.createChannel(currentProject!.orgId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels', currentProject?.orgId] })
      setShowCreateChannel(false)
      setNewChannelName('')
    },
  })

  const deleteChannelMutation = useMutation({
    mutationFn: (channelId: string) => chatApi.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels', currentProject?.orgId] })
    },
  })

  // Read receipts: mark channel read when switching
  const markReadMutation = useMutation({
    mutationFn: (channelId: string) => chatApi.markRead(channelId),
  })

  // Channel members
  const { data: channelMembers } = useQuery({
    queryKey: ['chat-channel-members', activeChannel],
    queryFn: () =>
      chatApi.listChannelMembers(activeChannel!).then((r) => {
        const d = r.data
        return Array.isArray(d) ? d : (d as any)?.items ?? d ?? []
      }),
    enabled: !!activeChannel,
    staleTime: 30_000,
  })

  const { data: orgMembers } = useQuery({
    queryKey: ['chat-org-members', currentProject?.orgId],
    queryFn: () =>
      chatApi.listOrgMembers(currentProject!.orgId).then((r) => {
        const d = r.data
        return Array.isArray(d) ? d : (d as any)?.items ?? d ?? []
      }),
    enabled: !!currentProject?.orgId && showAddMember,
    staleTime: 120_000,
  })

  const members = channelMembers ?? []

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null || !members.length) return []
    const q = mentionQuery.toLowerCase()
    return members.filter((m: any) => (m.userName ?? '').toLowerCase().includes(q)).slice(0, 5)
  }, [mentionQuery, members])

  const eligibleToAdd = useMemo(() => {
    if (!orgMembers || !Array.isArray(orgMembers)) return []
    const memberIds = new Set(members.map((m: any) => m.id))
    return orgMembers.filter((u: any) => !memberIds.has(u.id))
  }, [orgMembers, members])

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannel && channels.length > 0) {
      setActiveChannel(channels[0].id)
    }
  }, [channels, activeChannel])

  // Mark read when channel changes
  useEffect(() => {
    if (activeChannel) {
      markReadMutation.mutate(activeChannel)
    }
  }, [activeChannel])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageList])

  // Close reaction picker on outside click
  useEffect(() => {
    if (!reactionPickerFor) return
    const close = () => setReactionPickerFor(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [reactionPickerFor])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setMessage(val)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'

    const cursorPos = el.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionIdx(0)
    } else {
      setMentionQuery(null)
    }
  }, [])

  const insertMention = useCallback(
    (username: string) => {
      const textarea = textareaRef.current
      if (!textarea) return
      const cursorPos = textarea.selectionStart ?? message.length
      const textBeforeCursor = message.slice(0, cursorPos)
      const mentionStart = textBeforeCursor.lastIndexOf('@')
      if (mentionStart === -1) return
      const before = message.slice(0, mentionStart)
      const after = message.slice(cursorPos)
      setMessage(`${before}@${username} ${after}`)
      setMentionQuery(null)
      textarea.focus()
    },
    [message],
  )

  const handleSend = useCallback(async () => {
    if (!message.trim() || !activeChannel || isSending) return
    const content = message
    setMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(activeChannel, content)
  }, [message, activeChannel, isSending, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery !== null && mentionSuggestions.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, mentionSuggestions.length - 1)); return }
        if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)); return }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionSuggestions[mentionIdx].userName); return }
        if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend, mentionQuery, mentionSuggestions, mentionIdx, insertMention],
  )

  const handleSaveEdit = (messageId: string) => {
    if (!editContent.trim()) return
    editMessage.mutate({ messageId, content: editContent })
    setEditingMessageId(null)
    setEditContent('')
  }

  const activeChannelData = channels.find((c: ChatChannel) => c.id === activeChannel)

  const renderMessageContent = (content: string) =>
    content.split(/(@\w+)/g).map((part, j) =>
      part.startsWith('@') ? (
        <span key={j} className="rounded px-1 font-medium" style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}>
          {part}
        </span>
      ) : (
        <span key={j}>{part}</span>
      ),
    )

  return (
    <div
      className="flex h-[calc(100vh-var(--topbar-height)-48px)] overflow-hidden border"
      style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-xl)' }}
    >
      {/* ── Channel sidebar ── */}
      <div
        className="flex w-[240px] shrink-0 flex-col border-e"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('nav.chat')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* CHANNELS heading + create button */}
          <div className="mb-1 flex items-center justify-between px-2">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
            >
              {t('chat.channels')}
            </span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
              title={t('chat.createChannel', { defaultValue: 'New channel' })}
            >
              <Plus size={12} />
            </button>
          </div>

          {channelsLoading && (
            <div className="px-2 py-2">
              <SkeletonRow />
              <div className="mt-2"><SkeletonRow /></div>
              <div className="mt-2"><SkeletonRow /></div>
            </div>
          )}
          {channelsError && (
            <p className="px-2 py-2 text-[12px]" style={{ color: 'var(--danger)' }}>{t('common.retry')}</p>
          )}
          {!channelsLoading && channels.length === 0 && !channelsError && (
            <p className="px-2 py-4 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('chat.noChannels')}
            </p>
          )}
          {channels.map((ch: ChatChannel) => (
            <div
              key={ch.id}
              className="group flex items-center gap-1 rounded"
              style={{ background: activeChannel === ch.id ? 'var(--bg-active)' : 'transparent' }}
            >
              <button
                onClick={() => setActiveChannel(ch.id)}
                className="flex flex-1 items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors"
                style={{
                  color: activeChannel === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeChannel === ch.id ? 500 : 400,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
              >
                <Hash size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span className="flex-1 truncate text-start">{ch.name}</span>
                {(ch.unreadCount ?? 0) > 0 && (
                  <span
                    className="flex h-4 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {ch.unreadCount}
                  </span>
                )}
              </button>
              {!ch.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChannelMutation.mutate(ch.id)
                    if (activeChannel === ch.id) setActiveChannel(channels.find((c: ChatChannel) => c.id !== ch.id)?.id)
                  }}
                  className="me-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--bg-elevated)]"
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  title={t('chat.deleteChannel', { defaultValue: 'Delete channel' })}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Message area ── */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* Channel header */}
        <div
          className="flex shrink-0 flex-col border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center justify-between px-4" style={{ height: 48 }}>
            <div className="flex items-center gap-2">
              <Hash size={16} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeChannelData?.name}
              </span>
              {activeChannelData?.description && (
                <span className="hidden text-[12px] sm:inline" style={{ color: 'var(--text-tertiary)' }}>
                  — {activeChannelData.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Search toggle */}
              <button
                onClick={() => { setShowSearch(!showSearch); setShowPinned(false) }}
                className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  color: showSearch ? 'var(--primary-text)' : 'var(--text-tertiary)',
                  background: showSearch ? 'var(--primary-ghost)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={t('chat.searchMessages', { defaultValue: 'Search messages' })}
              >
                <Search size={14} />
              </button>
              {/* Pinned toggle */}
              <button
                onClick={() => { setShowPinned(!showPinned); setShowSearch(false) }}
                className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  color: showPinned ? 'var(--primary-text)' : 'var(--text-tertiary)',
                  background: showPinned ? 'var(--primary-ghost)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={t('chat.pinnedMessages', { defaultValue: 'Pinned Messages' })}
              >
                <Pin size={14} />
              </button>
              {/* Members toggle */}
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  color: showMembers ? 'var(--primary-text)' : 'var(--text-tertiary)',
                  background: showMembers ? 'var(--primary-ghost)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Users size={14} />
                <span>{t('chat.members')}</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="border-t px-4 py-2" style={{ borderColor: 'var(--border)' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat.searchPlaceholder', { defaultValue: 'Search messages...' })}
                className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-[13px] outline-none"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
        </div>

        {/* Pinned messages panel */}
        {showPinned && (
          <div
            className="shrink-0 border-b px-4 py-3"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', maxHeight: 200, overflowY: 'auto' }}
          >
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              <Pin size={11} />
              {t('chat.pinnedMessages', { defaultValue: 'Pinned Messages' })}
            </div>
            {pinnedLoading && <SkeletonRow />}
            {!pinnedLoading && pinnedMessages.length === 0 && (
              <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                {t('chat.noPinned', { defaultValue: 'No pinned messages' })}
              </p>
            )}
            {pinnedMessages.map((pm: ChatMessage) => (
              <div
                key={pm.id}
                className="mb-2 rounded-lg border p-2.5"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
              >
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{pm.userName}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}><TimeAgo date={pm.createdAt} /></span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{pm.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search results or message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {showSearch && searchQuery.trim().length >= 2 ? (
            <>
              {isSearching && <div className="mt-4"><SkeletonRow /></div>}
              {!isSearching && searchResults.length === 0 && (
                <EmptyState
                  icon={Search}
                  title={t('chat.noSearchResults', { defaultValue: 'No messages found' })}
                  description={searchQuery}
                />
              )}
              {searchResults.map((msg: ChatMessage) => (
                <div key={msg.id} className="mb-3 rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{msg.userName}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}><TimeAgo date={msg.createdAt} /></span>
                  </div>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              {messagesLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mt-4"><SkeletonRow /></div>
              ))}

              {messagesError && (
                <div className="flex flex-col items-center gap-2 py-16">
                  <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{t('common.retry')}</p>
                </div>
              )}

              {!messagesLoading && !messagesError && messageList.length === 0 && activeChannel && (
                <EmptyState
                  icon={MessageSquare}
                  title={t('chat.noMessages')}
                  description={t('chat.noMessagesDesc')}
                />
              )}

              {messageList.map((msg: ChatMessage, i: number) => {
                const prevMsg = messageList[i - 1]
                const showDate = shouldShowDateDivider(msg, prevMsg)
                const sameAuthor =
                  !showDate &&
                  prevMsg?.userId === msg.userId &&
                  new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 300_000
                const isOwn = msg.userId === user?.id
                const isEditing = editingMessageId === msg.id

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="my-4 flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
                        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                        <span className="text-[12px] font-medium">{getDateLabel(msg.createdAt, t)}</span>
                        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                      </div>
                    )}

                    <div
                      className={cn('group relative rounded-md transition-colors', sameAuthor ? 'mt-0.5' : 'mt-4')}
                      style={{ margin: '0 -8px', padding: '4px 8px' }}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => { setHoveredMessageId(null); if (reactionPickerFor === msg.id) setReactionPickerFor(null) }}
                    >
                      {/* Hover action bar */}
                      {hoveredMessageId === msg.id && !isEditing && (
                        <div
                          className="absolute end-2 top-1 z-10 flex items-center gap-0.5 rounded-lg border shadow-md"
                          style={{ background: 'var(--bg-raised)', borderColor: 'var(--border)', padding: '2px 4px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Emoji react */}
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id) }}
                              className="flex h-6 w-6 items-center justify-center rounded text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                              style={{ color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', background: 'none' }}
                              title={t('chat.react', { defaultValue: 'React' })}
                            >
                              <Smile size={13} />
                            </button>
                            {reactionPickerFor === msg.id && (
                              <div
                                className="absolute end-0 top-8 z-20 flex gap-1 rounded-lg border p-2 shadow-lg"
                                style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-strong)' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {QUICK_EMOJIS.map((emoji) => {
                                  const reaction = msg.reactions?.find((r) => r.emoji === emoji)
                                  const hasReacted = reaction?.userIds?.includes(user?.id ?? '') ?? false
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        toggleReaction.mutate({ messageId: msg.id, emoji, hasReacted })
                                        setReactionPickerFor(null)
                                      }}
                                      className="flex h-7 w-7 items-center justify-center rounded text-[16px] transition-colors hover:bg-[var(--bg-hover)]"
                                      style={{ border: 'none', cursor: 'pointer', background: hasReacted ? 'var(--primary-ghost)' : 'none' }}
                                    >
                                      {emoji}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Edit (own messages only) */}
                          {isOwn && (
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content) }}
                              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
                              style={{ color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', background: 'none' }}
                              title={t('chat.editMessage', { defaultValue: 'Edit message' })}
                            >
                              <Edit2 size={12} />
                            </button>
                          )}

                          {/* Pin / Unpin */}
                          <button
                            onClick={() => togglePin.mutate(msg.id)}
                            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
                            style={{
                              color: msg.isPinned ? 'var(--primary-text)' : 'var(--text-tertiary)',
                              background: msg.isPinned ? 'var(--primary-ghost)' : 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            title={msg.isPinned ? t('chat.unpinMessage', { defaultValue: 'Unpin' }) : t('chat.pinMessage', { defaultValue: 'Pin' })}
                          >
                            <Pin size={12} />
                          </button>

                          {/* Delete (own messages only) */}
                          {isOwn && (
                            <button
                              onClick={() => deleteMessage.mutate(msg.id)}
                              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
                              style={{ color: 'var(--danger)', border: 'none', cursor: 'pointer', background: 'none' }}
                              title={t('chat.deleteMessage', { defaultValue: 'Delete message' })}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}

                      {!sameAuthor ? (
                        <div className="flex gap-2.5">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                            style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
                          >
                            {msg.userName?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-baseline gap-2">
                              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {msg.userName}
                              </span>
                              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                <TimeAgo date={msg.createdAt} />
                              </span>
                              {msg.editedAt && (
                                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                  {t('chat.edited', { defaultValue: '(edited)' })}
                                </span>
                              )}
                              {msg.isPinned && (
                                <Pin size={10} style={{ color: 'var(--primary-text)', flexShrink: 0 }} />
                              )}
                            </div>
                            {isEditing ? (
                              <div className="mt-1">
                                <textarea
                                  autoFocus
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg.id) }
                                    if (e.key === 'Escape') { setEditingMessageId(null); setEditContent('') }
                                  }}
                                  className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-[13px] leading-relaxed outline-none"
                                  style={{ borderColor: 'var(--primary)', color: 'var(--text-primary)', minHeight: 60 }}
                                  rows={2}
                                />
                                <div className="mt-1 flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(msg.id)}
                                    className="rounded-md px-2 py-1 text-[11px] font-medium"
                                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button
                                    onClick={() => { setEditingMessageId(null); setEditContent('') }}
                                    className="rounded-md px-2 py-1 text-[11px] font-medium"
                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {renderMessageContent(msg.content)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="ps-[46px]">
                          {isEditing ? (
                            <div>
                              <textarea
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg.id) }
                                  if (e.key === 'Escape') { setEditingMessageId(null); setEditContent('') }
                                }}
                                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-[13px] leading-relaxed outline-none"
                                style={{ borderColor: 'var(--primary)', color: 'var(--text-primary)', minHeight: 60 }}
                                rows={2}
                              />
                              <div className="mt-1 flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium"
                                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  onClick={() => { setEditingMessageId(null); setEditContent('') }}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium"
                                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {renderMessageContent(msg.content)}
                              </div>
                              {msg.editedAt && (
                                <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                  {t('chat.edited', { defaultValue: '(edited)' })}
                                </span>
                              )}
                              {msg.isPinned && <Pin size={10} style={{ color: 'var(--primary-text)', flexShrink: 0 }} />}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reactions row */}
                      {!isEditing && (
                        <ReactionBar
                          reactions={msg.reactions ?? []}
                          currentUserId={user?.id ?? ''}
                          onToggle={(emoji, hasReacted) => toggleReaction.mutate({ messageId: msg.id, emoji, hasReacted })}
                        />
                      )}

                      {/* Linked error card */}
                      {msg.linkedError && (
                        <div
                          className="ms-[46px] mt-2 rounded-lg border p-3"
                          style={{ borderColor: 'var(--border-accent)', background: 'var(--primary-ghost)', maxWidth: 420 }}
                        >
                          <div className="mb-1 flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: msg.linkedError.status === 'resolved' ? 'var(--success)' : 'var(--danger)' }}
                            />
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {msg.linkedError.exceptionClass}
                            </span>
                          </div>
                          <div className="mb-1.5 text-[12px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {msg.linkedError.message}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                              style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}
                            >
                              {msg.linkedError.environment}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              {t('chat.occurrences', { count: msg.linkedError.occurrences })}
                            </span>
                            <a
                              href={`/errors/${msg.linkedError.fingerprint}`}
                              className="ms-auto text-[12px] font-medium hover:underline"
                              style={{ color: 'var(--primary-text)' }}
                            >
                              {t('chat.viewError')} &rarr;
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div className="px-4 pb-1">
            <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{sendError}</p>
          </div>
        )}

        {/* Input area */}
        <div className="relative shrink-0 px-4 pb-4">
          {/* Mention autocomplete */}
          {mentionQuery !== null && mentionSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                insetInlineStart: 16,
                insetInlineEnd: 16,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                padding: 4,
                marginBottom: 4,
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {mentionSuggestions.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => insertMention(m.userName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 8px',
                    background: i === mentionIdx ? 'var(--bg-active)' : 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--primary-ghost)', color: 'var(--primary-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600, flexShrink: 0,
                    }}
                  >
                    {(m.userName || '?')[0]?.toUpperCase()}
                  </span>
                  <span>{m.userName}</span>
                </button>
              ))}
            </div>
          )}

          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-raised)' }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.messagePlaceholder', { channel: activeChannelData?.name ?? '' })}
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-relaxed outline-none"
              style={{ color: 'var(--text-primary)', minHeight: 40, maxHeight: 120 }}
            />
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex gap-0.5">
                <button
                  onClick={() => {
                    if (textareaRef.current) {
                      const pos = textareaRef.current.selectionStart ?? message.length
                      const before = message.slice(0, pos)
                      const after = message.slice(pos)
                      setMessage(before + '@' + after)
                      setMentionQuery('')
                      textareaRef.current.focus()
                    }
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  @ {t('chat.mention', { defaultValue: 'Mention' })}
                </button>
                <button
                  onClick={() => {
                    const emoji = QUICK_EMOJIS[Math.floor(Math.random() * QUICK_EMOJIS.length)]
                    const pos = textareaRef.current?.selectionStart ?? message.length
                    setMessage(message.slice(0, pos) + emoji + message.slice(pos))
                    textareaRef.current?.focus()
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Smile size={13} />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                className="flex items-center gap-1 rounded px-3 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                style={{ height: 28, background: 'var(--primary)', color: '#fff', border: 'none', cursor: !message.trim() || isSending ? 'not-allowed' : 'pointer' }}
              >
                {isSending ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Send <Send size={12} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Members panel ── */}
      {showMembers && (
        <div
          className="flex w-[240px] shrink-0 flex-col border-s"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-4"
            style={{ borderColor: 'var(--border)', height: 48 }}
          >
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('chat.members')}
            </span>
            <button
              onClick={() => setShowMembers(false)}
              className="rounded p-1 transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {(Array.isArray(members) ? members : []).map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded px-2 py-1.5" style={{ fontSize: 13 }}>
                <span
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary-ghost)', color: 'var(--primary-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {(m.userName || '?')[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{m.userName}</div>
                </div>
              </div>
            ))}
            {(!members || members.length === 0) && (
              <p className="px-2 py-4 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                {t('empty.noMembers')}
              </p>
            )}
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + {t('chat.addMember', { defaultValue: 'Add member' })}
            </button>
            {showAddMember && eligibleToAdd.length > 0 && (
              <div style={{ padding: '4px 0' }}>
                {eligibleToAdd.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      await chatApi.addChannelMember(activeChannel!, u.id, u.userName || u.email.split('@')[0])
                      queryClient.invalidateQueries({ queryKey: ['chat-channel-members', activeChannel] })
                      setShowAddMember(false)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, flexShrink: 0 }}>
                      {(u.userName || u.email)[0]?.toUpperCase()}
                    </span>
                    {u.userName || u.email.split('@')[0]}
                  </button>
                ))}
              </div>
            )}
            {showAddMember && eligibleToAdd.length === 0 && (
              <p className="px-2 py-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {t('chat.allMembersAdded', { defaultValue: 'All org members are in this channel' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Create channel modal ── */}
      {showCreateChannel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCreateChannel(false)} />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl"
            style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
          >
            <h3 className="mb-4 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('chat.createChannel', { defaultValue: 'New channel' })}
            </h3>
            <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('chat.channelName', { defaultValue: 'Channel name' })}
            </label>
            <input
              autoFocus
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter' && newChannelName.trim()) { createChannelMutation.mutate(newChannelName.trim()) } }}
              placeholder="my-channel"
              className="mb-4 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreateChannel(false); setNewChannelName('') }}
                className="flex-1 rounded-lg border py-2 text-[13px] font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => newChannelName.trim() && createChannelMutation.mutate(newChannelName.trim())}
                disabled={!newChannelName.trim() || createChannelMutation.isPending}
                className="flex-1 rounded-lg py-2 text-[13px] font-medium disabled:opacity-40"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
