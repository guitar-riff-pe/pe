import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiRequest } from '@shared/api'
import { updateSession } from '@entities/sessions'
import styles from './sign-out-button.module.scss'

export function SignOutButton({ className, children = 'Выйти' }: { className?: string; children?: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  return <>
    <button type="button" className={[styles.button, className].filter(Boolean).join(' ')} disabled={pending} aria-busy={pending || undefined} onClick={async () => {
      setPending(true); setError('')
      try {
        await apiRequest<void>('/auth/logout', { method: 'POST' })
        await updateSession(queryClient, null)
        await navigate({ to: '/login' })
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось выйти.') }
      finally { setPending(false) }
    }}>{children}</button>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </>
}
