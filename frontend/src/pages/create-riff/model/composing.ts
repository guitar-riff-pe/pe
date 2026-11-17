import type { RiffNote, RiffTimbre } from '@entities/riffs'

export type RiffDraft = { notes: readonly RiffNote[]; timbre: RiffTimbre }
export const draftKey = (roundId?: string) => `riff-battle.riff-draft.${roundId ?? 'local'}`

export { remainingSeconds } from '../../../shared/lib/countdown/clock.ts'

export function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function readDraft(value: string | null, bars: number): RiffDraft | null {
  if (!value) return null
  try {
    const draft = JSON.parse(value) as RiffDraft
    if (!['clean', 'distortion'].includes(draft.timbre) || !Array.isArray(draft.notes) || draft.notes.length > 512) return null
    const ids = new Set<string>()
    for (const note of draft.notes) {
      if (!note || typeof note.id !== 'string' || !note.id || ids.has(note.id) ||
          ![note.pitch, note.start, note.duration, note.velocity].every(Number.isFinite) ||
          !Number.isInteger(note.pitch) || note.pitch < 40 || note.pitch > 88 || note.start < 0 ||
          note.duration <= 0 || note.start + note.duration > bars * 4 * 480 || note.velocity < 0 || note.velocity > 1) return null
      ids.add(note.id)
    }
    return draft
  } catch { return null }
}
