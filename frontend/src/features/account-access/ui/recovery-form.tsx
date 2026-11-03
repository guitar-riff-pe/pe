import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, TextField } from '@shared/ui'
import { isValidEmail } from '../model/validation'
import styles from './account-access.module.scss'

export function RecoveryForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setError('Введи корректную электронную почту.')
      setNotice('')
      return
    }
    setError('')
    setNotice('Отправка ссылок пока недоступна: почтовый сервис ещё не подключён.')
  }

  return (
    <div className={styles.recovery}>
      <h1 className={styles.recoveryTitle}>Забыли пароль?</h1>
      <p className={styles.subtitle}>Пришлём ссылку для смены пароля.</p>
      <form className={styles.form} noValidate onSubmit={submit}>
        <TextField
          label="Электронная почта"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={error}
          onChange={(event) => { setEmail(event.target.value); setError(''); setNotice('') }}
        />
        <Button className={styles.submit} type="submit" fullWidth>Отправить ссылку</Button>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      </form>
      <Link className={styles.backLink} to="/login">Вернуться ко входу</Link>
      <p className={styles.recoveryNote}>Если аккаунт с этой почтой существует,<br />письмо придёт в течение нескольких минут.</p>
    </div>
  )
}
