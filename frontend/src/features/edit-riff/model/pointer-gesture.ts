import type { RiffNote } from '@entities/riffs'

type NotePointerGesture = {
  pointerId: number
  mode: 'create' | 'move' | 'resize'
  x: number
  y: number
  gridWidth: number
  note: RiffNote
  auditionPitch: number
  before: RiffNote[]
  selectedIds: string[]
  lastTicks: number
  lastPitch: number
  lastDuration: number
}

type SelectionPointerGesture = {
  mode: 'select'
  pointerId: number
  x: number
  y: number
  clientX: number
  clientY: number
  beforeSelection: string[]
  hit: RiffNote | undefined
  dragging: boolean
}

export type PointerGesture = NotePointerGesture | SelectionPointerGesture
