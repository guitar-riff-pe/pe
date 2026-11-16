import { LOWEST_PITCH, HIGHEST_PITCH } from './editor-geometry'
import { getNoteName } from '@entities/riffs'

export const LOWEST_GUITAR_PITCH = LOWEST_PITCH
export const HIGHEST_GUITAR_PITCH = HIGHEST_PITCH
export const GUITAR_ROW_COUNT = HIGHEST_GUITAR_PITCH - LOWEST_GUITAR_PITCH + 1
export const KEYBOARD_WIDTH = 64
export const GRID_X = KEYBOARD_WIDTH + 8
export const RULER_HEIGHT = 32
export const BAR_COUNT = 4
export const STEPS_PER_BAR = 16

export const guitarRows = Array.from({ length: GUITAR_ROW_COUNT }, (_, index) => {
  const pitch = HIGHEST_GUITAR_PITCH - index
  const pitchClass = pitch % 12
  const variant = pitchClass === 0 ? 'octave'
    : [1, 3, 6, 8, 10].includes(pitchClass) ? 'accidental' : 'natural'
  return {
    pitch,
    label: getNoteName(pitch),
    variant,
  } as const
})
