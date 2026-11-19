import { getErrorDetails } from '../../lib/errors'
import { Button } from '../button/button'
import catUrl from './error-cat.svg'
import styles from './error-state.module.scss'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { kind, title, message } = getErrorDetails(error)
  return <section className={styles.state} role="alert">
    <img className={styles.cat} src={catUrl} width="280" height="260" alt="" aria-hidden="true" />
    <p className={styles.eyebrow}>{kind === 'not-found' ? '404 · Здесь пока тихо' : 'Кажется, мы сбились с ритма'}</p>
    <h1>{title}</h1>
    <p className={styles.message}>{message}</p>
    <div className={styles.actions}>
      {kind === 'chunk'
        ? <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
        : onRetry && <Button onClick={onRetry}>Попробовать снова</Button>}
      <a href="/">На главную</a>
    </div>
  </section>
}
