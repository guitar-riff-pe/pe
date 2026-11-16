import { memo, useMemo } from 'react'
import styles from './waveform.module.scss'

type WaveformProps = {
  bars?: number
  seed?: number
  minHeight?: number
  maxHeight?: number
  className?: string
}

export const Waveform = memo(function Waveform({ bars = 90, seed = 1, minHeight = 5, maxHeight = 40, className }: WaveformProps) {
  const path = useMemo(() => Array.from({ length: bars }, (_, index) => {
      const height = minHeight + Math.abs(Math.sin((index + seed * 3) * .34) * Math.cos((index + seed) * .18)) * (maxHeight - minHeight)
      return `M${index * 4} ${(maxHeight - height) / 2}h2v${height}h-2z`
    }).join(''), [bars, seed, minHeight, maxHeight])
  return <svg className={[styles.waveform, className].filter(Boolean).join(' ')} aria-hidden="true" focusable="false"
    viewBox={`0 0 ${Math.max(1, bars * 4 - 2)} ${maxHeight}`} preserveAspectRatio="none" height={maxHeight}>
    <path d={path} />
  </svg>
})
