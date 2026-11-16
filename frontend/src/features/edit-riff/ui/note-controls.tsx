import { memo, useId, useState, type FormEvent } from 'react'
import { Button } from '@shared/ui'
import type { RiffNote } from '@entities/riffs'
import type { RiffEditorController } from '../model/use-riff-editor'
import { SNAP_TICKS, TICKS_PER_BEAT } from '../lib/editor-geometry'
import { MAX_NOTES } from '../lib/note-limit'
import styles from './note-controls.module.scss'

const pitches = Array.from({ length: 49 }, (_, index) => 40 + index)
const pitchName = (pitch: number) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][pitch % 12]}${Math.floor(pitch / 12) - 1}`

export const NoteControls = memo(function NoteControls({ editor, readOnly }: { editor: RiffEditorController; readOnly: boolean }) {
  const { state, dispatch } = editor
  const selected = state.notes.find(note => state.selectedIds.includes(note.id))
  const [visited, setVisited] = useState(false)
  const disabled = readOnly || !!state.gesture
  const full = state.notes.length >= MAX_NOTES
  return <><p className={styles.count} role="status">Нот: {state.notes.length} / {MAX_NOTES}.
    {full && ' Достигнут лимит. Удали лишние ноты, чтобы добавить новые. Существующие ноты можно менять.'}
  </p><details className={styles.panel} onToggle={event => { if (event.currentTarget.open) setVisited(true) }}>
    <summary>Ноты: создание и точная настройка с клавиатуры</summary>
    {visited && <>
    <p>Tab — переход между полями. Выбери ноту из списка или нажми «Новая нота». Enter в форме сохраняет параметры.</p>
    <label>Выбрать ноту
      <select value={selected?.id ?? ''} disabled={disabled} onChange={event => {
        dispatch({ type: 'select', noteId: event.target.value || null })
      }}>
        <option value="">Нота не выбрана</option>
        {state.notes.map((note, index) => <option key={note.id} value={note.id}>
          {index + 1}. {pitchName(note.pitch)}, доля {note.start / TICKS_PER_BEAT + 1}, длительность {note.duration / TICKS_PER_BEAT}
        </option>)}
      </select>
    </label>
    <Button variant="secondary" disabled={disabled || full} onClick={() => dispatch({ type: 'select', noteId: null })}>Новая нота</Button>
    <NoteForm key={selected?.id ?? 'new'} note={selected}
      totalTicks={state.totalTicks} disabled={disabled || (full && !selected)} onSave={note => {
        if (note.id) dispatch({ type: 'update', note })
        else { dispatch({ type: 'create', note: { ...note, id: crypto.randomUUID() } }); dispatch({ type: 'commit' }) }
      }} />
    <Button variant="ghost" disabled={disabled || !state.selectedIds.length} onClick={() => dispatch({ type: 'delete' })}>Удалить выделенные ноты</Button>
    <p>На полотне: Ctrl/Cmd+A — выделить всё; Shift+стрелки — сдвинуть ноты; Delete — удалить; Ctrl/Cmd+Z — отменить; пробел — воспроизвести.</p>
    </>}
  </details></>
})

function NoteForm({ note, totalTicks, disabled, onSave }: {
  note?: RiffNote; totalTicks: number; disabled: boolean; onSave: (note: RiffNote) => void
}) {
  const id = useId()
  const [pitch, setPitch] = useState(note?.pitch ?? 64)
  const [start, setStart] = useState(String((note?.start ?? 0) / TICKS_PER_BEAT + 1))
  const [duration, setDuration] = useState(String((note?.duration ?? SNAP_TICKS) / TICKS_PER_BEAT))
  const [velocity, setVelocity] = useState(String(Math.round((note?.velocity ?? 0.8) * 100)))
  const [error, setError] = useState('')
  const [source, setSource] = useState(note)
  // Synchronize external edits/undo without replacing the focused DOM fields.
  if (source !== note) {
    setSource(note)
    setPitch(note?.pitch ?? 64)
    setStart(String((note?.start ?? 0) / TICKS_PER_BEAT + 1))
    setDuration(String((note?.duration ?? SNAP_TICKS) / TICKS_PER_BEAT))
    setVelocity(String(Math.round((note?.velocity ?? 0.8) * 100)))
    setError('')
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (disabled) return
    const startTicks = (Number(start) - 1) * TICKS_PER_BEAT
    const durationTicks = Number(duration) * TICKS_PER_BEAT
    if (startTicks + durationTicks > totalTicks) { setError('Нота выходит за конец риффа. Уменьши длительность или измени начало.'); return }
    setError('')
    onSave({ id: note?.id ?? '', pitch, start: startTicks, duration: durationTicks, velocity: Number(velocity) / 100 })
  }
  return <form onSubmit={submit}>
    <fieldset disabled={disabled} className={styles.fields}>
      <legend>{note ? 'Параметры выбранной ноты' : 'Добавить ноту'}</legend>
      <label>Высота<select value={pitch} onChange={event => setPitch(Number(event.target.value))}>{pitches.map(value => <option key={value} value={value}>{pitchName(value)}</option>)}</select></label>
      <label>Начало, доля<input type="number" required min={1} max={totalTicks / TICKS_PER_BEAT + 1 - SNAP_TICKS / TICKS_PER_BEAT} step={0.25} value={start} onChange={event => setStart(event.target.value)} /></label>
      <label>Длительность, доли<input type="number" required min={0.25} max={totalTicks / TICKS_PER_BEAT} step={0.25} value={duration} onChange={event => setDuration(event.target.value)} /></label>
      <label>Сила звука, %<input type="number" required min={1} max={100} step={1} value={velocity} onChange={event => setVelocity(event.target.value)} /></label>
      <Button type="submit" aria-describedby={error ? id : undefined}>{note ? 'Применить параметры' : 'Добавить ноту'}</Button>
    </fieldset>
    {error && <p id={id} role="alert">{error}</p>}
  </form>
}
