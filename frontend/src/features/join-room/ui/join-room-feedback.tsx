import { Link } from '@tanstack/react-router'
import { normalizeRoomCode } from '@entities/rooms'
import styles from './join-room.module.scss'

export function JoinRoomFeedback({ error, needsLogin, code }: { error?: string; needsLogin: boolean; code: string }) {
  if (!error) return null
  return <p className={styles.error} role="alert">{error} {needsLogin &&
    <Link to="/login" search={{ redirect: `/rooms?code=${encodeURIComponent(normalizeRoomCode(code))}` }}>Войти или продолжить гостем →</Link>}
  </p>
}
