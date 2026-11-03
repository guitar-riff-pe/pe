import { Button } from '@shared/ui'
import styles from './play-riff-button.module.scss'

type PlayRiffButtonProps = {
  name: string
  playing: boolean
  onPlay: () => void
  label?: string
  mobileLabel?: string
  compactOnMobile?: boolean
}

export function PlayRiffButton({ name, playing, onPlay, label = 'Прослушать', mobileLabel, compactOnMobile = false }: PlayRiffButtonProps) {
  return <Button className={[styles.button, compactOnMobile && styles.compact, mobileLabel && styles.hasMobileLabel].filter(Boolean).join(' ')} variant="secondary" onClick={onPlay} aria-label={`${playing ? 'Остановить' : 'Прослушать'} ${name}`} aria-pressed={playing}>
    <span className={styles.icon} aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
    <span className={styles.desktopText}>{playing ? 'Пауза' : label}</span>
    {mobileLabel ? <span className={styles.mobileText}>{playing ? 'Пауза' : mobileLabel}</span> : null}
  </Button>
}
