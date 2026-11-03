import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, PasswordField, TextField } from '@shared/ui'
import { isValidEmail } from '../model/validation'
import styles from './account-access.module.scss'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [notice, setNotice] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      email: isValidEmail(email) ? undefined : 'Введи корректную электронную почту.',
      password: password ? undefined : 'Введи пароль.',
    }
    setErrors(nextErrors)
    setNotice(nextErrors.email || nextErrors.password ? '' : 'Вход пока недоступен: сервер авторизации ещё не подключён.')
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
          onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); setNotice('') }}
        />
        <PasswordField
          label="Пароль"
          autoComplete="current-password"
          placeholder="Введите пароль"
          value={password}
          error={errors.password}
          onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); setNotice('') }}
        />
        <Link className={styles.forgotLink} to="/forgot-password">Забыли пароль?</Link>
        <Button className={styles.submit} type="submit" fullWidth>Войти</Button>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      </form>
      <p className={styles.switch}>Нет аккаунта? <Link to="/register">Регистрация</Link></p>
      <GuestAccess />
    </>
  )
}

export function GuestAccess() {
  return (
    <div className={styles.guest}>
      <Link className={styles.guestLink} to="/rooms">Продолжить гостем</Link>
      <p className={styles.guestNote}>Гости участвуют наравне со всеми.<br />Статистика доступна после входа.</p>
    </div>
  )
}
