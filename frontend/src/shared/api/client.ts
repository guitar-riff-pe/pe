import { createIsomorphicFn } from '@tanstack/react-start'

const publicApiUrl = import.meta.env.VITE_API_URL?.trim() || undefined
const getApiUrl = createIsomorphicFn()
  .server(() => process.env.API_INTERNAL_URL ?? publicApiUrl ?? 'http://localhost:8000/api/v1')
  .client(() => {
    if (publicApiUrl) return publicApiUrl
    const url = new URL('/api/v1', window.location.origin)
    url.port = '8000'
    return url.href
  })

const incomingCookies = createIsomorphicFn()
  .server(async () => {
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    return getRequestHeader('cookie')
  })
  .client(() => undefined)

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiUrl().replace(/\/$/, '')
  const headers = new Headers(options.headers)
  const cookies = await incomingCookies()
  if (cookies) headers.set('Cookie', cookies)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method ?? 'GET').toUpperCase())) headers.set('X-CSRF-Protection', '1')
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: 'include', cache: 'no-store' })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { detail?: unknown } | null
    throw new ApiError(response.status, typeof error?.detail === 'string' ? error.detail : `Ошибка сервера (${response.status})`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiRequest(path, { signal })
}
