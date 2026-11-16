import { memo, useEffect, useState } from 'react'
import type { SubscribePosition } from '../../lib/playback-position'

export const PlaybackBar = memo(function PlaybackBar({ subscribe, ticksPerBeat, bars }: {
  subscribe: SubscribePosition; ticksPerBeat: number; bars: number
}) {
  const [bar, setBar] = useState(1)
  useEffect(() => {
    let previous = -1
    return subscribe(ticks => {
      const next = Math.min(bars, Math.floor((ticks ?? 0) / (ticksPerBeat * 4)) + 1)
      if (next !== previous) { previous = next; setBar(next) }
    })
  }, [subscribe, ticksPerBeat, bars])
  return <>Такт {bar} из {bars}</>
})
