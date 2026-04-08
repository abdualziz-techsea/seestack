import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@seestack/shared'
import type { ChatMessage } from '@seestack/shared'

export function useChatSearch(orgId: string | undefined) {
  const [query, setQuery] = useState('')

  const search = useQuery({
    queryKey: ['chat-search', orgId, query],
    queryFn: () =>
      chatApi.searchMessages(orgId!, query).then((r) => {
        const d = r.data
        return (Array.isArray(d) ? d : (d as any)?.items ?? []) as ChatMessage[]
      }),
    enabled: !!orgId && query.trim().length >= 2,
    staleTime: 10_000,
    retry: false,
  })

  return {
    query,
    setQuery,
    results: search.data ?? [],
    isSearching: search.isFetching,
  }
}
