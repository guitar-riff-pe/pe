import type { RiffNote } from '@entities/riffs'

export type RiffTiming = { ticksPerBeat: number; lengthTicks: number }
export type ScheduledNote = { time: number; duration: number; frequency: number; velocity: number }

export function normaliseTempo(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.max(40, Math.min(400, Math.round(value))) : 120
}

export function scheduleRiff(notes: readonly RiffNote[], bpm: number, timing: RiffTiming) {
  if (!Number.isFinite(timing.ticksPerBeat) || timing.ticksPerBeat <= 0 ||
      !Number.isFinite(timing.lengthTicks) || timing.lengthTicks <= 0) throw new Error('Invalid riff timing')
  const tempo = normaliseTempo(bpm)
  const secondsPerTick = 60 / tempo / timing.ticksPerBeat
  const events: ScheduledNote[] = notes.flatMap(note => {
    if (![note.pitch, note.start, note.duration, note.velocity].every(Number.isFinite) ||
        note.pitch < 0 || note.pitch > 127 || note.start < 0 || note.start >= timing.lengthTicks ||
        note.duration <= 0 || note.velocity <= 0) return []
    return [{
      time: note.start * secondsPerTick,
      duration: Math.min(note.duration, timing.lengthTicks - note.start) * secondsPerTick,
      frequency: 440 * 2 ** ((note.pitch - 69) / 12),
      velocity: Math.min(1, note.velocity),
    }]
  }).sort((a, b) => a.time - b.time)
  return { events, duration: timing.lengthTicks * secondsPerTick, secondsPerTick, tempo }
}
