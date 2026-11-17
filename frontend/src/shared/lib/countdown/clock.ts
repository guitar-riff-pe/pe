export function remainingSeconds(deadline: string, serverNow: string, elapsedMs: number) {
  return Math.max(0, Math.ceil((Date.parse(deadline) - Date.parse(serverNow) - elapsedMs) / 1000))
}

export function createServerClock(deadline: string, serverNow: string, now: () => number) {
  const started = now()
  return () => remainingSeconds(deadline, serverNow, now() - started)
}
