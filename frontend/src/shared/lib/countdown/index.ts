import { useCallback, useEffect, useRef, useState } from 'react'
import { createServerClock, remainingSeconds } from './clock'

/** Only the deadline changes React state; event handlers read the clock directly. */
export function useServerDeadline(deadline: string, serverNow: string) {
  const clock = useRef<(() => number) | null>(null)
  const [expired, setExpired] = useState(() => remainingSeconds(deadline, serverNow, 0) === 0)
  useEffect(() => {
    clock.current = createServerClock(deadline, serverNow, () => performance.now())
    const update = () => setExpired(clock.current!() === 0)
    update()
    const timer = window.setTimeout(update, Math.max(0, Date.parse(deadline) - Date.parse(serverNow)))
    document.addEventListener('visibilitychange', update)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', update) }
  }, [deadline, serverNow])
  const getSeconds = useCallback(() => clock.current?.() ?? 0, [])
  return { expired, getSeconds }
}

export function useServerClock(deadline?: string, serverNow?: string) {
  const clock = useRef<(() => number) | null>(null)
  const [seconds, setSeconds] = useState(() => deadline && serverNow ? remainingSeconds(deadline, serverNow, 0) : 0)
  useEffect(() => {
    if (!deadline || !serverNow) { clock.current = null; return }
    clock.current = createServerClock(deadline, serverNow, () => performance.now())
    const tick = () => setSeconds(clock.current?.() ?? 0)
    tick()
    const timer = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [deadline, serverNow])
  const getSeconds = useCallback(() => clock.current?.() ?? 0, [])
  return { seconds, getSeconds }
}

export function useServerCountdown(deadline: string, serverNow: string) {
  return useServerClock(deadline, serverNow).seconds
}

export function countdownLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
