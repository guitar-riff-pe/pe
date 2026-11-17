import { memo } from 'react'
import { countdownLabel, useServerCountdown } from '../../lib/countdown'

export const Countdown = memo(function Countdown({ deadline, serverNow, expiredLabel = 'Время вышло.', className }: {
  deadline: string; serverNow: string; expiredLabel?: string; className?: string
}) {
  const seconds = useServerCountdown(deadline, serverNow)
  return <p role="timer" className={className}>{seconds ? `Осталось ${countdownLabel(seconds)}` : expiredLabel}</p>
})
