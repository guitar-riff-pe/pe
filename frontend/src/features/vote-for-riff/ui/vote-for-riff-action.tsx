import { Button } from '@shared/ui'
import styles from './vote-for-riff-action.module.scss'

type VoteForRiffActionProps = { state: 'available' | 'confirmed' | 'locked' | 'own'; onVote: () => void }

export function VoteForRiffAction({ state, onVote }: VoteForRiffActionProps) {
  if (state === 'own') return null
  if (state === 'confirmed') return <span className={styles.confirmed}>✓ Голос подтверждён</span>
  return <Button variant="secondary" fullWidth disabled={state === 'locked'} onClick={onVote}>{state === 'locked' ? 'Голос уже отдан' : 'Выбрать рифф'}</Button>
}
