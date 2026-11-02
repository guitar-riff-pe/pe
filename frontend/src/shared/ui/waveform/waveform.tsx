import styles from './waveform.module.scss'

type WaveformProps = {
  bars?: number
  seed?: number
  minHeight?: number
  maxHeight?: number
  className?: string
}

export function Waveform({ bars = 90, seed = 1, minHeight = 5, maxHeight = 40, className }: WaveformProps) {
  return <div className={[styles.waveform, className].filter(Boolean).join(' ')} aria-hidden="true">
    {Array.from({ length: bars }, (_, index) => {
      const height = minHeight + Math.abs(Math.sin((index + seed * 3) * .34) * Math.cos((index + seed) * .18)) * (maxHeight - minHeight)
      return <span key={index} style={{ height: `${height}px` }} />
    })}
  </div>
}
