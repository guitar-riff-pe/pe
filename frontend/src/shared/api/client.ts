import { createIsomorphicFn } from '@tanstack/react-start'
import axios, { AxiosHeaders, type AxiosRequestConfig } from 'axios'
import { getErrorMessage } from '../lib/errors'

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
  constructor(public readonly status: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
  }
}

const client = axios.create({
  // Use the same transport in SSR and the browser, including fetch's cache policy.
  adapter: 'fetch',
  withCredentials: true,
  fetchOptions: { cache: 'no-store' },
  responseType: 'json',
})

export type ApiRequestOptions<D = unknown> = Pick<AxiosRequestConfig<D>, 'method' | 'data' | 'params'> & {
  headers?: Record<string, string> | AxiosHeaders
  signal?: AbortSignal
}

export async function apiRequest<T, D = unknown>(path: string, options: ApiRequestOptions<D> = {}): Promise<T> {
  const headers = new AxiosHeaders(options.headers)
  const cookies = await incomingCookies()
  if (cookies) headers.set('Cookie', cookies)
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method ?? 'GET').toUpperCase())) headers.set('X-CSRF-Protection', '1')
  try {
    const response = await client.request<T>({
      ...options,
      baseURL: getApiUrl().replace(/\/$/, ''),
      url: path,
      headers,
    })
    return response.status === 204 ? undefined as T : response.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (axios.isAxiosError<{ detail?: unknown }>(error) && error.response) {
      const { status, data } = error.response
      const message = getErrorMessage({ status, message: typeof data?.detail === 'string' ? data.detail : undefined })
      throw new ApiError(status, message, { cause: error })
    }
    if (axios.isAxiosError(error) && !error.response) {
      throw new ApiError(0, getErrorMessage(error), { cause: error })
    }
    throw error
  }
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiRequest(path, { signal })
}
