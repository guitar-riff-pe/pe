import type { RiffNote } from '@entities/riffs'
import { HIGHEST_PITCH, TOTAL_TICKS } from './editor-geometry.ts'

export type SelectionRectangle = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number }

export function selectionRectangle(start: Point, end: Point): SelectionRectangle {
  return {
    x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y),
  }
}

/** Test the visible note tiles, including partial intersections, in grid pixels. */
export function notesInRectangle(notes: readonly RiffNote[], rectangle: SelectionRectangle, contentWidth: number, rowHeight: number, totalTicks = TOTAL_TICKS): string[] {
  if (rectangle.width <= 0 || rectangle.height <= 0) return []
  return notes.filter(note => {
    const x = note.start / totalTicks * contentWidth + 1
    const y = (HIGHEST_PITCH - note.pitch) * rowHeight + 1
    const width = Math.max(1, note.duration / totalTicks * contentWidth - 2)
    const height = rowHeight - 2
    return x < rectangle.x + rectangle.width && x + width > rectangle.x &&
      y < rectangle.y + rectangle.height && y + height > rectangle.y
  }).map(note => note.id)
}
