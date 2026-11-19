import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ClientOnly, Link } from '@tanstack/react-router'
import { decodeNotes, saveRiff, type RiffPayload } from '@entities/riffs'
import { roundKey, type RoundData, type ComposingRound } from '@entities/rounds'
import { useRoundSession, RoundSessionStatus, RoundConnectionStatus } from '@features/follow-round'
import { BattleProgress } from '@widgets/battle-progress'
import { RiffEditor } from '@widgets/riff-editor'
import { Button } from '@shared/ui'
import { draftKey, formatCountdown, readDraft, type RiffDraft } from '../model/composing'
import { readRoundDraft, roundDraftKey } from '../model/round-draft'
import type { CreateRiffWorkspaceProps } from '../model/workspace'
export type { CreateRiffWorkspaceProps } from '../model/workspace'
import { useRiffWorkspace } from '../model/use-riff-workspace'
import styles from './create-riff-page.module.scss'

const localRound = { bars: 4, bpm: 120, loopTitle: 'Полиритмия', loopUrl: `${import.meta.env.BASE_URL}sounds/drums/poly-120-4.wav` }
const emptyDraft: RiffDraft = { notes: [], timbre: 'clean' }

export function CreateRiffPage({ roundId }: { roundId?: string }) {
  return roundId ? <LiveComposing key={roundId} roundId={roundId} /> : <ClientOnly fallback={<p role="status">Загружаем черновик…</p>}><LocalComposing /></ClientOnly>
}

function LiveComposing({ roundId }: { roundId: string }) {
  const state = useRoundSession(roundId, 'composing')
  if (!state.round) return <main className={styles.page}><BattleProgress stage={2} />
    <RoundSessionStatus state={state} returnTo={`/rooms/compose?roundId=${encodeURIComponent(roundId)}`} />
  </main>
  return <ClientOnly fallback={<p role="status">Загружаем черновик…</p>}>
    <LiveWorkspace key={`${state.session.data!.id}:${roundId}`} round={state.round} playerId={state.session.data!.id} connectionStatus={<RoundConnectionStatus state={state} />} />
  </ClientOnly>
}

function LiveWorkspace({ round, playerId, connectionStatus }: { round: ComposingRound; playerId: string; connectionStatus: ReactNode }) {
  const storageKey = roundDraftKey(playerId, round.id)
  const queries = useQueryClient()
  const [initial] = useState(() => {
    try {
      const draft = round.own_riff ? { notes: decodeNotes(round.own_riff.notes), timbre: round.own_riff.timbre } : emptyDraft
      if (!readDraft(JSON.stringify(draft), round.bars)) throw new Error('Сохранённый рифф содержит ноты вне диапазона редактора.')
      let recovered: RiffDraft | null = null
      try { recovered = readRoundDraft(localStorage.getItem(storageKey), round.bars, round.own_riff?.updated_at ?? null) } catch { /* Storage may be unavailable. */ }
      return { draft: recovered ?? draft, error: '' }
    } catch (reason) {
      return { draft: emptyDraft, error: reason instanceof Error ? reason.message : 'Не удалось прочитать сохранённый рифф.' }
    }
  })
  const submit = useCallback(async (payload: RiffPayload, signal: AbortSignal) => {
    const saved = await saveRiff(round.id, payload, signal)
    await queries.cancelQueries({ queryKey: roundKey(round.id) })
    queries.setQueryData<RoundData>(roundKey(round.id), previous => previous ? { ...previous, own_riff: saved } : previous)
  }, [round.id, queries])
  if (initial.error) return <main className={styles.page}><BattleProgress stage={2} />
    <p role="alert">{initial.error}</p><Link to="/rooms/lobby" search={{ roomId: round.room_id, stay: true }}>В комнату →</Link>
  </main>
  return <CreateRiffWorkspace round={round} initialDraft={initial.draft} onSave={submit} storageKey={storageKey} connectionStatus={connectionStatus} />
}

function LocalComposing() {
  const [draft] = useState(() => {
    try { return readDraft(localStorage.getItem(draftKey()), 4) ?? emptyDraft } catch { return emptyDraft }
  })
  return <CreateRiffWorkspace initialDraft={draft} />
}

/** The same workspace is used by a live round, local drafts, and Storybook. */
export function CreateRiffWorkspace({ round, initialDraft = emptyDraft, onSave, storageKey, connectionStatus }: CreateRiffWorkspaceProps & { connectionStatus?: ReactNode }) {
  const { notes, timbre, setNotes, changeTimbre, saving, error, submitted, dirty, closed, seconds, submit, storageError } =
    useRiffWorkspace({ round, initialDraft, onSave, storageKey })

  const bars = round?.bars ?? localRound.bars
  const bpm = round?.bpm ?? localRound.bpm
  const loopTitle = round?.loop_title ?? localRound.loopTitle
  const loopUrl = round?.loop_url ?? localRound.loopUrl
  const settings = useMemo(() => ({ bars, bpm, loopTitle, loopUrl }), [bars, bpm, loopTitle, loopUrl])
  return <main className={styles.page}>
    <BattleProgress stage={2} />
    {connectionStatus}
    <header className={styles.intro}>
      <div><h1>Создание риффа</h1><p>{round ? 'Сохрани рифф до окончания времени. До конца раунда его можно менять.' : 'Свободный режим · создай рифф под общий ритм и сохрани черновик.'}</p></div>
      {round ? <p className={[styles.timer, seconds <= 60 && styles.urgent].filter(Boolean).join(' ')} role="timer" aria-label={closed ? 'Время вышло' : `Осталось ${formatCountdown(seconds)}`}>
        {closed ? 'Время вышло' : `Осталось ${formatCountdown(seconds)}`}
      </p> : <span className={styles.localBadge}>Локальный черновик</span>}
    </header>
    {closed && <p className={styles.notice} role="status">Редактирование завершено. {submitted ? 'Твой отправленный рифф участвует в раунде.' : 'Рифф не был отправлен.'}</p>}
    <RiffEditor initialNotes={initialDraft.notes} onNotesChange={setNotes} round={settings} timbre={timbre} onTimbreChange={changeTimbre} readOnly={closed} height={360} />
    <footer className={styles.footer}>
      <div><p className={submitted && !dirty ? styles.saved : styles.draft} role="status">{saving ? 'Сохраняем…' : submitted && !dirty ? round ? 'Рифф отправлен' : 'Черновик сохранён на этом устройстве' : dirty && submitted ? 'Есть несохранённые изменения' : 'Черновик · ещё не отправлен'}</p>
        {storageError && <p role="alert">{storageError}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <Button className={styles.submit} disabled={closed || (!dirty && submitted) || (!notes.length && !submitted)} pending={saving} onClick={() => void submit()}>
        {round ? submitted ? 'Сохранить изменения →' : 'Отправить рифф →' : 'Сохранить черновик'}
      </Button>
    </footer>
    {round ? <Link className={styles.back} to="/rooms/lobby" search={{ roomId: round.room_id, stay: true }}>← В комнату</Link> : <Link className={styles.back} to="/rooms">← К комнатам</Link>}
  </main>
}
