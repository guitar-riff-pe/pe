import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Button, PasswordField, TextField } from '@shared/ui'
import { isValidEmail, isValidNickname, isValidPassword } from '../model/validation'
import { useAuthAction } from '../model/use-auth-action'
import { GuestAccess } from './guest-access'
import styles from './account-access.module.scss'

export function SignUpForm() {
  const search = useSearch({ strict: false })
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ nickname?: string; email?: string; password?: string }>({})
  const action = useAuthAction()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      nickname: isValidNickname(nickname) ? undefined : 'Ник должен быть от 2 до 24 символов.',
      email: isValidEmail(email) ? undefined : 'Введи корректную электронную почту.',
      password: isValidPassword(password) ? undefined : 'Пароль должен содержать от 8 до 72 символов.',
    }
    setErrors(nextErrors)
    if (!Object.values(nextErrors).some(Boolean)) void action.submit('/auth/register', { nickname: nickname.trim(), email: email.trim(), password })
  }

  return (
    <>
      <h2 className={styles.title}>Создай аккаунт</h2>
      <p className={styles.subtitle}>Сохрани свой ник и статистику.</p>
      <form className={[styles.form, styles.signUpForm].join(' ')} noValidate onSubmit={submit}>
        <TextField
          label="Никнейм"
          autoComplete="username"
          placeholder="NeonRiff"
          value={nickname}
          hint="2–24 символа"
          error={errors.nickname}
          onChange={(event) => { setNickname(event.target.value); setErrors((current) => ({ ...current, nickname: undefined })) }}
        />
        <TextField
          label="Электронная почта"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })) }}
        />
        <PasswordField
          label="Пароль"
          autoComplete="new-password"
          placeholder="Не менее 8 символов"
          value={password}
          hint="Не менее 8 символов."
          error={errors.password}
          onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })) }}
        />
        <Button className={styles.submit} type="submit" fullWidth pending={action.pending}>Создать аккаунт</Button>
        {action.error ? <p className={styles.notice} role="alert">{action.error}</p> : null}
      </form>
      <p className={styles.switch}>Уже есть аккаунт? <Link to="/login" search={{ redirect: search.redirect }}>Войти</Link></p>
      <GuestAccess />
    </>
  )
}
