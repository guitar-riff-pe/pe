import type { RiffNote } from './riff-note'

export type RiffTimbre = 'clean' | 'distortion'
export type ApiNote = { pitch: string; start: number; duration: number; velocity: number }
export type RiffPayload = { timbre: RiffTimbre; notes: ApiNote[] }
export type SavedRiff = RiffPayload & { id: string; updated_at: string }

const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
export const RIFF_TICKS_PER_BEAT = 480

export function decodeNotes(notes: readonly ApiNote[]): RiffNote[] {
  return notes.map((note, index) => {
    const match = /^([A-G])([#b]?)([0-8])$/.exec(note.pitch)
    if (!match) throw new Error('Не удалось прочитать высоту ноты')
    return {
      id: `saved-${index}`, pitch: (Number(match[3]) + 1) * 12 + semitones[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0),
      start: note.start * RIFF_TICKS_PER_BEAT, duration: note.duration * RIFF_TICKS_PER_BEAT,
      velocity: note.velocity / 127,
    }
  })
}

export function encodeRiff(notes: readonly RiffNote[], timbre: RiffTimbre): RiffPayload {
  return {
    timbre,
    notes: notes.map(note => ({
      pitch: `${names[note.pitch % 12]}${Math.floor(note.pitch / 12) - 1}`,
      start: note.start / RIFF_TICKS_PER_BEAT, duration: note.duration / RIFF_TICKS_PER_BEAT,
      velocity: Math.max(1, Math.min(127, Math.round(note.velocity * 127))),
    })),
  }
}
