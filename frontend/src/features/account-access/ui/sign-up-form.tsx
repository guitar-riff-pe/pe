import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, PasswordField, TextField } from '@shared/ui'
import { isValidEmail, isValidNickname, isValidPassword } from '../model/validation'
import { GuestAccess } from './sign-in-form'
import styles from './account-access.module.scss'

export function SignUpForm() {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ nickname?: string; email?: string; password?: string }>({})
  const [notice, setNotice] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      nickname: isValidNickname(nickname) ? undefined : 'Никнейм: 3–20 букв, цифр или _.',
      email: isValidEmail(email) ? undefined : 'Введи корректную электронную почту.',
      password: isValidPassword(password) ? undefined : 'Пароль должен содержать не менее 8 символов.',
    }
    setErrors(nextErrors)
    setNotice(Object.values(nextErrors).some(Boolean) ? '' : 'Регистрация пока недоступна: сервер авторизации ещё не подключён.')
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
          maxLength={20}
          value={nickname}
          hint="3–20 символов: буквы, цифры, _"
          error={errors.nickname}
          onChange={(event) => { setNickname(event.target.value); setErrors((current) => ({ ...current, nickname: undefined })); setNotice('') }}
        />
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
          autoComplete="new-password"
          placeholder="Не менее 8 символов"
          value={password}
          hint="Не менее 8 символов."
          error={errors.password}
          onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); setNotice('') }}
        />
        <Button className={styles.submit} type="submit" fullWidth>Создать аккаунт</Button>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      </form>
      <p className={styles.switch}>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      <GuestAccess />
    </>
  )
}
