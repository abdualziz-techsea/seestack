export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export const formatMs = (ms: number): string => {
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${ms}ms`
}

export const formatPercent = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`

export const truncate = (str: string, length: number): string =>
  str.length > length ? `${str.slice(0, length)}...` : str
