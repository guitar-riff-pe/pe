import { Surface, Waveform } from '@shared/ui'
import styles from './riff-preview.module.scss'

const notes = [
  { left: 0, top: 79, width: 8 }, { left: 9, top: 62, width: 5 },
  { left: 16, top: 95, width: 11 }, { left: 29, top: 45, width: 9 },
  { left: 39, top: 63, width: 6 }, { left: 46, top: 28, width: 12 },
  { left: 60, top: 79, width: 9 }, { left: 70, top: 45, width: 12 },
  { left: 84, top: 62, width: 16 },
]
export function RiffPreview() {
  return (
    <div className={styles.stage}>
      <Surface className={styles.card}>
        <p className={styles.eyebrow}>Твой следующий рифф</p>
        <div className={styles.heading}><h2>Distortion</h2><span>120 BPM / 4 такта</span></div>
        <div className={styles.roll} role="img" aria-label="Пример нотной партии для риффа Distortion">
          {notes.map((note, index) => (
            <span className={styles.note} key={index} style={{ left: `${note.left}%`, top: `${note.top}px`, width: `${note.width}%` }} />
          ))}
        </div>
        <Waveform bars={112} seed={2} minHeight={7} maxHeight={32} className={styles.waveform} />
      </Surface>
    </div>
  )
}
