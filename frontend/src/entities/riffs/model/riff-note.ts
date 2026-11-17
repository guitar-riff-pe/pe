export type RiffNote = {
  id: string
  /** MIDI pitch, independent of the viewport. */
  pitch: number
  /** Musical ticks, not pixels or seconds. */
  start: number
  duration: number
  velocity: number
}

const pitchNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export function getNoteName(pitch: number): string {
  return `${pitchNames[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}
