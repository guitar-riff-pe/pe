import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Button, PasswordField, TextField } from '@shared/ui'
import { isValidEmail } from '../model/validation'
import { useAuthAction } from '../model/use-auth-action'
import { GuestAccess } from './guest-access'
import styles from './account-access.module.scss'

export function SignInForm() {
  const search = useSearch({ strict: false })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const action = useAuthAction()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      email: isValidEmail(email) ? undefined : 'Введи корректную электронную почту.',
      password: password ? undefined : 'Введи пароль.',
    }
    setErrors(nextErrors)
    if (!nextErrors.email && !nextErrors.password) void action.submit('/auth/login', { email: email.trim(), password })
  }

  return (
    <>
      <h2 className={styles.title}>С возвращением</h2>
      <p className={styles.subtitle}>Войди под своим ником.</p>
      <form className={styles.form} noValidate onSubmit={submit}>
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
          autoComplete="current-password"
          placeholder="Введите пароль"
          value={password}
          error={errors.password}
          onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })) }}
        />
        <Link className={styles.forgotLink} to="/forgot-password">Забыли пароль?</Link>
        <Button className={styles.submit} type="submit" fullWidth pending={action.pending}>Войти</Button>
        {action.error ? <p className={styles.notice} role="alert">{action.error}</p> : null}
      </form>
      <p className={styles.switch}>Нет аккаунта? <Link to="/register" search={{ redirect: search.redirect }}>Регистрация</Link></p>
      <GuestAccess />
    </>
  )
}
