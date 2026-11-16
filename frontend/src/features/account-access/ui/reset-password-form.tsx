import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { apiRequest } from '@shared/api'
import { Button, PasswordField } from '@shared/ui'
import { isValidPassword } from '../model/validation'
import styles from './account-access.module.scss'

export function ResetPasswordForm({ token }: { token?: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return
    if (!isValidPassword(password)) { setError('Пароль должен содержать от 8 до 72 символов.'); return }
    if (password !== confirmation) { setError('Пароли не совпадают.'); return }
    setPending(true); setError('')
    try {
      await apiRequest<void>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) })
      setSaved(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сменить пароль.') }
    finally { setPending(false) }
  }
  return <>
    <h1 className={styles.title}>Новый пароль</h1>
    {saved ? <p role="status">Пароль изменён. Теперь можно войти.</p> : token ? <form className={styles.form} onSubmit={submit}>
      <PasswordField label="Новый пароль" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
      <PasswordField label="Повтори пароль" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      {error && <p className={styles.notice} role="alert">{error}</p>}
      <Button type="submit" fullWidth pending={pending}>Сохранить пароль</Button>
    </form> : <p role="alert">Открой ссылку для смены пароля из письма.</p>}
    <Link className={styles.backLink} to="/login">Вернуться ко входу</Link>
  </>
}
