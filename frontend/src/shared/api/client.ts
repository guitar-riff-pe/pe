import { createIsomorphicFn } from '@tanstack/react-start'

const publicApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const getApiUrl = createIsomorphicFn()
  .server(() => process.env.API_INTERNAL_URL ?? publicApiUrl)
  .client(() => publicApiUrl)

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const baseUrl = getApiUrl().replace(/\/$/, '')
  const response = await fetch(`${baseUrl}${path}`, { signal })
  if (!response.ok) throw new Error(`API returned ${response.status}`)
  return response.json() as Promise<T>
}
