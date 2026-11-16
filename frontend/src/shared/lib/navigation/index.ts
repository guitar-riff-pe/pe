const destinations = new Set(['/rooms', '/rooms/create', '/rooms/lobby', '/rooms/compose', '/rooms/vote', '/rooms/results', '/profile'])

export function safeReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return
  try {
    const url = new URL(value, 'https://riff.local')
    if (url.origin === 'https://riff.local' && destinations.has(url.pathname)) return url.pathname + url.search
  } catch { /* Ignore malformed return links. */ }
}

export const authSearch = (search: Record<string, unknown>): { redirect?: string } => ({ redirect: safeReturnTo(search.redirect) })
