import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { updateSession, type SessionPlayer } from '@entities/sessions'
import { apiRequest } from '@shared/api'
import { safeReturnTo } from '@shared/lib/navigation'

export function useAuthAction() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(path: string, payload: Record<string, string>) {
    if (pending) return
    setPending(true); setError('')
    try {
      const { player } = await apiRequest<{ player: SessionPlayer }>(path, { method: 'POST', body: JSON.stringify(payload) })
      await updateSession(queryClient, player)
      const redirect = safeReturnTo(search.redirect)
      if (redirect) await navigate({ href: redirect })
      else await navigate({ to: '/rooms' })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти. Попробуй ещё раз.')
    } finally { setPending(false) }
  }

  return { pending, error, submit }
}
