import type { RiffNote } from '@entities/riffs'

export const TICKS_PER_BEAT = 480
export const SNAP_TICKS = TICKS_PER_BEAT / 4
export const TOTAL_TICKS = 4 * 4 * TICKS_PER_BEAT
export const LOWEST_PITCH = 40
export const HIGHEST_PITCH = 88

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const snap = (ticks: number) => Math.round(ticks / SNAP_TICKS) * SNAP_TICKS

export function constrainNote(note: RiffNote, totalTicks = TOTAL_TICKS): RiffNote {
  const duration = clamp(snap(note.duration), SNAP_TICKS, totalTicks)
  return {
    ...note,
    pitch: clamp(Math.round(note.pitch), LOWEST_PITCH, HIGHEST_PITCH),
    start: clamp(snap(note.start), 0, totalTicks - duration),
    duration,
    velocity: clamp(note.velocity, 0, 1),
  }
}

export function moveNote(note: RiffNote, deltaTicks: number, deltaPitch: number, totalTicks = TOTAL_TICKS): RiffNote {
  return constrainNote({ ...note, start: note.start + snap(deltaTicks), pitch: note.pitch + deltaPitch }, totalTicks)
}

export function resizeNote(note: RiffNote, deltaTicks: number, totalTicks = TOTAL_TICKS): RiffNote {
  return { ...note, duration: clamp(snap(note.duration + deltaTicks), SNAP_TICKS, totalTicks - note.start) }
}

/** Clamp a shared delta so a selection keeps its intervals at the boundaries. */
export function translateSelection(notes: RiffNote[], selectedIds: readonly string[], ticks: number, pitch: number, totalTicks = TOTAL_TICKS): RiffNote[] {
  const selection = new Set(selectedIds)
  const selected = notes.filter(note => selection.has(note.id))
  if (!selected.length) return notes
  const deltaTicks = clamp(snap(ticks), -Math.min(...selected.map(note => note.start)),
    totalTicks - Math.max(...selected.map(note => note.start + note.duration)))
  const deltaPitch = clamp(Math.round(pitch), LOWEST_PITCH - Math.min(...selected.map(note => note.pitch)),
    HIGHEST_PITCH - Math.max(...selected.map(note => note.pitch)))
  if (!deltaTicks && !deltaPitch) return notes
  return notes.map(note => selection.has(note.id)
    ? { ...note, start: note.start + deltaTicks, pitch: note.pitch + deltaPitch } : note)
}

export function noteAtPoint(notes: readonly RiffNote[], x: number, y: number, gridWidth: number, rowHeight: number, totalTicks = TOTAL_TICKS) {
  const ticks = x / gridWidth * totalTicks
  const pitch = HIGHEST_PITCH - Math.floor(y / rowHeight)
  for (let index = notes.length - 1; index >= 0; index--) {
    const note = notes[index]
    if (note.pitch === pitch && ticks >= note.start && ticks < note.start + note.duration) return note
  }
}
