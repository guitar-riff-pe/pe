import { memo, useId, useMemo, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import type { RiffNote, RiffTimbre } from '@entities/riffs'
import { PianoRoll, NoteControls, useRiffEditor, TICKS_PER_BEAT } from '@features/edit-riff'
import { normaliseTempo, useRiffPlayback } from '@features/play-riff'
import { Button, PlaybackBar, Waveform } from '@shared/ui'
import styles from './riff-editor.module.scss'

export type RiffEditorProps = {
  height?: number
  rowHeight?: number
  initialNotes?: readonly RiffNote[]
  onNotesChange?: (notes: readonly RiffNote[]) => void
  children?: ReactNode
  round?: { bars: number; bpm: number; loopTitle: string; loopUrl: string }
  timbre?: RiffTimbre
  onTimbreChange?: (timbre: RiffTimbre) => void
  readOnly?: boolean
}

export const RiffEditor = memo(function RiffEditor({ height, rowHeight, initialNotes, onNotesChange, children, round, timbre = 'clean', onTimbreChange, readOnly = false }: RiffEditorProps) {
  const bars = round?.bars ?? 4
  const timbreId = useId()
  const barLabel = `${bars} ${bars === 1 ? 'такт' : bars <= 4 ? 'такта' : 'тактов'}`
  const totalTicks = bars * 4 * TICKS_PER_BEAT
  const editor = useRiffEditor(initialNotes, onNotesChange, totalTicks)
  const { state, dispatch } = editor
  const [tempo, setTempo] = useState('120')
  const timing = useMemo(() => ({ ticksPerBeat: TICKS_PER_BEAT, lengthTicks: totalTicks }), [totalTicks])
  const soundOptions = useMemo(() => ({ backingUrl: round?.loopUrl, timbre }), [round?.loopUrl, timbre])
  const playback = useRiffPlayback(timing, soundOptions)
  const muted = playback.volume === 0
  const lastVolume = useRef(0.6)
  const busy = playback.status !== 'idle'
  const bpm = round?.bpm ?? normaliseTempo(Number(tempo))
  const play = () => {
    setTempo(String(bpm))
    void playback.play(state.notes, bpm)
  }
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, input, select, textarea') || target.isContentEditable) return
    if (event.code === 'Space' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      if (!event.repeat) { if (busy) playback.stop(); else if (!state.gesture) play() }
    } else if (event.key === 'Escape' && busy) { event.preventDefault(); playback.stop() }
  }

  return <section className={[styles.editor, round && styles.roundEditor].filter(Boolean).join(' ')} aria-label="Полотно гитарного риффа" onKeyDown={keys}>
    {!round && <p className={styles.heading}>{barLabel} · 4/4 · сетка 1/16</p>}
    <div className={styles.playback} role="group" aria-label="Воспроизведение риффа">
      <Button variant="secondary" disabled={!busy && ((!state.notes.length && !round?.loopUrl) || !!state.gesture)}
        aria-label={busy ? 'Остановить рифф' : 'Воспроизвести рифф'} aria-pressed={busy}
        onClick={busy ? playback.stop : play}
      >{busy ? '■ Остановить' : '▶ Воспроизвести'}</Button>
      {round ? <span className={styles.metadata}>{bpm} BPM · 4/4 · {barLabel}</span> : <label className={styles.control}>Темп, BPM
        <input type="number" min={40} max={400} step={1} value={tempo} disabled={busy}
          onChange={event => setTempo(event.target.value)} onBlur={() => setTempo(String(bpm))} />
      </label>}
      {!round && <label className={styles.control}>Громкость: {Math.round(playback.volume * 100)}%
        <input type="range" min={0} max={100} value={Math.round(playback.volume * 100)}
          onChange={event => playback.setVolume(Number(event.target.value) / 100)} />
      </label>}
      {round && <span className={styles.gridStep}>Шаг сетки: 1/16</span>}
      <span className={styles.playbackStatus} role="status">{playback.status === 'loading' || playback.soundState === 'loading' ? 'Загружаем гитару…'
        : playback.status === 'playing' ? <PlaybackBar subscribe={playback.subscribePosition} ticksPerBeat={TICKS_PER_BEAT} bars={bars} />
          : ''}</span>
    </div>
    {playback.error && <p className={styles.error} role="alert">{playback.error}</p>}
    <div className={round ? styles.studio : undefined}>
      {round && <aside className={styles.instrument} aria-label="Настройки звучания">
        <fieldset className={styles.timbre} disabled={readOnly || busy}>
          <legend>Тембр</legend>
          {(['distortion', 'clean'] as const).map(value => <label key={value} className={timbre === value ? styles.activeTimbre : undefined}>
            <input type="radio" name={timbreId} value={value} checked={timbre === value} onChange={() => onTimbreChange?.(value)} />
            {value === 'clean' ? 'Clean' : 'Distortion'}
          </label>)}
        </fieldset>
        <label className={styles.control}>Громкость: {Math.round(playback.volume * 100)}%
          <input aria-label="Громкость" type="range" min={0} max={100} value={Math.round(playback.volume * 100)} onChange={event => {
            const value = Number(event.target.value) / 100
            if (value > 0) lastVolume.current = value
            playback.setVolume(value)
          }} />
        </label>
        <Button variant="secondary" aria-pressed={muted} onClick={() => {
          if (!muted) lastVolume.current = playback.volume
          playback.setVolume(muted ? lastVolume.current : 0)
        }}>{muted ? 'Включить звук' : 'Без звука'}</Button>
      </aside>}
      <div className={styles.tracks}>
      {round && <div className={styles.drums} aria-label={`Барабаны: ${round.loopTitle}`}>
        <span>Барабаны / общий ритм <span className={styles.loopTitle}>{round.loopTitle}</span></span>
        <Waveform bars={280} minHeight={4} maxHeight={38} />
      </div>}
      <div className={styles.tools} role="group" aria-label="Правка нот">
      <Button variant="secondary" disabled={readOnly || busy || !state.past.length || !!state.gesture} onClick={() => dispatch({ type: 'undo' })}>Отменить</Button>
      <Button variant="secondary" disabled={readOnly || busy || !state.future.length || !!state.gesture} onClick={() => dispatch({ type: 'redo' })}>Повторить</Button>
      <Button variant="ghost" disabled={readOnly || busy || !state.selectedIds.length || !!state.gesture} onClick={() => dispatch({ type: 'delete' })}>Удалить выделенные</Button>
    </div>
    <PianoRoll editor={editor} height={height} rowHeight={rowHeight} initialPitch={round ? 76 : undefined} readOnly={readOnly || busy}
      subscribePosition={playback.status === 'playing' ? playback.subscribePosition : undefined} onAudition={playback.preview}
    >{children}</PianoRoll>
    <NoteControls editor={editor} readOnly={readOnly || busy} />
    </div>
    </div>
    <p className={styles.credits}>Сэмплы: <a href="https://github.com/cluesurf/wavebase">ClueSurf / wavebase · Parker Fly</a>
      {' · '}<a href={`${import.meta.env.BASE_URL}sounds/wavebase-guitar/ATTRIBUTION.txt`}>Public Domain</a>
    </p>
  </section>
})
