import { Button } from '@shared/ui'
import { useJoinRoom } from '../model/use-join-room'
import { JoinRoomFeedback } from './join-room-feedback'
import styles from './join-room.module.scss'

export function JoinRoomButton({ code, disabled = false, label = 'Войти →' }: { code?: string; disabled?: boolean; label?: string }) {
  const join = useJoinRoom()
  return <div className={styles.action}>
    <Button disabled={disabled || !code} pending={join.isPending} fullWidth onClick={() => {
      if (code && !join.isPending) join.mutate(code)
    }}>{label}</Button>
    <JoinRoomFeedback error={join.error?.message} needsLogin={join.needsLogin} code={code ?? ''} />
  </div>
}
