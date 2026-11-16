import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { encodeRiff, type RiffTimbre } from '@entities/riffs'
import { ApiError } from '@shared/api'
import { useServerClock } from '@shared/lib/countdown'
import type { CreateRiffWorkspaceProps } from './workspace'
import { draftKey, type RiffDraft } from './composing'
import { serializeRoundDraft } from './round-draft'
import { createDraftPersistence } from './draft-persistence'

type Options = CreateRiffWorkspaceProps & { initialDraft: RiffDraft }

export function useRiffWorkspace({ round, initialDraft, onSave, storageKey }: Options) {
  const [notes, setNotes] = useState(initialDraft.notes)
  const [timbre, setTimbre] = useState<RiffTimbre>(initialDraft.timbre)
  const [saved, setSaved] = useState(() => round
    ? round.own_riff ? JSON.stringify({ timbre: round.own_riff.timbre, notes: round.own_riff.notes }) : ''
    : JSON.stringify(encodeRiff(initialDraft.notes, initialDraft.timbre)))
  const [submitted, setSubmitted] = useState(!!round?.own_riff || (!round && initialDraft.notes.length > 0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [closedByServer, setClosedByServer] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const { seconds, getSeconds } = useServerClock(round?.composing_ends_at, round?.server_now)
  useEffect(() => () => abortRef.current?.abort(), [])
  const payload = useMemo(() => encodeRiff(notes, timbre), [notes, timbre])
  const serialised = useMemo(() => JSON.stringify(payload), [payload])
  const dirty = serialised !== saved
  const closed = !!round && (round.stage !== 'composing' || seconds === 0 || closedByServer)
  const changeTimbre = useCallback((value: RiffTimbre) => setTimbre(value), [])
  const revision = round?.own_riff?.updated_at ?? null
  const live = !!round
  const persistence = useMemo(() => createDraftPersistence(
    value => localStorage.setItem(storageKey ?? draftKey(), value), setStorageError,
  ), [storageKey])
  useEffect(() => {
    const flush = () => persistence.flush()
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      persistence.flush(false)
    }
  }, [persistence])
  useEffect(() => {
    if (live && !storageKey) return // Standalone previews do not persist live rounds.
    const draft = { notes, timbre }
    persistence.schedule(live ? serializeRoundDraft(draft, revision) : JSON.stringify(draft))
  }, [notes, timbre, storageKey, revision, live, persistence])
  useBlocker({
    shouldBlockFn: () => dirty && !closed && !window.confirm('Изменения ещё не отправлены. Покинуть редактор?'),
    enableBeforeUnload: dirty && !closed,
  })

  async function submit() {
    if (closed || saving || (round && getSeconds() === 0)) return
    const abort = new AbortController()
    abortRef.current = abort
    setSaving(true); setError('')
    try {
      if (round && !onSave) throw new Error('Отправка риффа пока недоступна.')
      if (onSave) await onSave(payload, abort.signal)
      else localStorage.setItem(draftKey(), JSON.stringify({ notes, timbre }))
      if (abort.signal.aborted) return
      setSaved(serialised); setSubmitted(true)
    } catch (reason) {
      if (abort.signal.aborted) return
      if (reason instanceof ApiError && reason.status === 409) setClosedByServer(true)
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить рифф. Попробуй ещё раз.')
    } finally { if (!abort.signal.aborted) setSaving(false) }
  }
  return { notes, timbre, setNotes, changeTimbre, saving, error, submitted, dirty, closed, seconds, submit, storageError }
}
