import { memo, useMemo, type ReactNode } from 'react'
import { Group, Layer, Stage } from 'react-konva'
import type { SubscribePosition } from '@shared/lib/playback-position'
import { Playhead } from './playhead'
import { BarLabel } from './bar-label'
import { PianoKey } from './piano-key'
import { PianoRollRow } from './piano-roll-row'
import { TickLine } from './tick-line'
import { NoteBlock } from './note-block'
import { SelectionMarquee } from './selection-marquee'
import type { SelectionRectangle } from '../lib/marquee-selection'
import type { RiffNote } from '@entities/riffs'
import { HIGHEST_PITCH, TICKS_PER_BEAT } from '../lib/editor-geometry'
import {
  GRID_X, GUITAR_ROW_COUNT, guitarRows, KEYBOARD_WIDTH,
  RULER_HEIGHT, STEPS_PER_BAR,
} from '../lib/piano-roll-layout'

type RiffEditorCanvasProps = {
  totalTicks: number
  width: number
  viewportHeight: number
  rowHeight: number
  scrollTop: number
  scrollLeft: number
  contentWidth: number
  children?: ReactNode
  notes: readonly RiffNote[]
  selectedIds: readonly string[]
  subscribePosition?: SubscribePosition
  onAudition?: (note: RiffNote) => void
  selectionRectangle: SelectionRectangle | null
}

function RiffEditorCanvas({
  totalTicks, width, viewportHeight, rowHeight, scrollTop, scrollLeft, contentWidth, children, notes, selectedIds, subscribePosition, onAudition, selectionRectangle,
}: RiffEditorCanvasProps) {
  const gridWidth = Math.max(1, width - GRID_X)
  const contentHeight = GUITAR_ROW_COUNT * rowHeight
  const barCount = totalTicks / (4 * TICKS_PER_BEAT)
  const stepCount = barCount * STEPS_PER_BAR

  // Geometry changes on resize/zoom, not on note edits or playback frames.
  const rulerLabels = useMemo(() => Array.from({ length: barCount }, (_, bar) => <BarLabel
    key={bar} x={bar * contentWidth / barCount + 8}
    y={8} width={Math.max(1, contentWidth / barCount - 8)}
  >{`Такт ${bar + 1}`}</BarLabel>), [contentWidth, barCount])

  const trackRows = useMemo(() => guitarRows.map((row, index) => <PianoRollRow
    key={row.pitch} y={index * rowHeight} width={contentWidth}
    height={rowHeight} variant={row.variant}
  />), [contentWidth, rowHeight])

  const horizontalTicks = useMemo(() => Array.from({ length: GUITAR_ROW_COUNT + 1 }, (_, index) => <TickLine
    key={`row-${index}`} y={index * rowHeight + 0.5}
    length={contentWidth} orientation="horizontal"
    variant={guitarRows[index]?.variant === 'octave' ? 'beat' : 'subdivision'}
  />), [contentWidth, rowHeight])

  const verticalTicks = useMemo(() => Array.from({ length: stepCount + 1 }, (_, step) => <TickLine
    key={`step-${step}`} x={Math.min(contentWidth - 0.5, step * contentWidth / stepCount + 0.5)}
    length={contentHeight}
    variant={step % STEPS_PER_BAR === 0 ? 'bar' : step % 4 === 0 ? 'beat' : 'subdivision'}
  />), [contentWidth, contentHeight, stepCount])

  const keyboardKeys = useMemo(() => guitarRows.map((row, index) => <PianoKey
    key={row.pitch} x={0.5} y={index * rowHeight + 0.5}
    width={KEYBOARD_WIDTH - 1} height={rowHeight - 1}
    variant={row.variant} label={row.label}
    onPointerDown={() => onAudition?.({ id: 'audition', pitch: row.pitch, start: 0, duration: 120, velocity: 0.8 })}
  />), [rowHeight, onAudition])

  const selection = useMemo(() => new Set(selectedIds), [selectedIds])
  const noteBlocks = useMemo(() => notes.map(note => <NoteBlock key={note.id} id={note.id}
    x={note.start / totalTicks * contentWidth + 1}
    y={(HIGHEST_PITCH - note.pitch) * rowHeight + 1}
    width={Math.max(1, note.duration / totalTicks * contentWidth - 2)}
    height={rowHeight - 2} selected={selection.has(note.id)}
  />), [notes, selection, contentWidth, rowHeight, totalTicks])

  const gridLayer = useMemo(() => <Layer name="grid" listening={false}>
      <Group name="ruler-clip" x={GRID_X} clipWidth={gridWidth} clipHeight={RULER_HEIGHT}>
        <Group x={-scrollLeft}>
          {rulerLabels}
        </Group>
      </Group>
      <Group name="tracks-clip" x={GRID_X} y={RULER_HEIGHT} clipWidth={gridWidth} clipHeight={viewportHeight}>
        <Group name="grid-content" x={-scrollLeft} y={-scrollTop}>
          {trackRows}
          {horizontalTicks}
          {verticalTicks}
        </Group>
      </Group>
    </Layer>, [gridWidth, viewportHeight, scrollLeft, scrollTop, rulerLabels, trackRows, horizontalTicks, verticalTicks])

  const notesLayer = useMemo(() => <Layer name="notes" listening={!!children}>
      {/* Clip in viewport coordinates, then scroll the content inside it.
          A separate layer alone does not constrain note drawing. */}
      <Group x={GRID_X} y={RULER_HEIGHT} clipWidth={gridWidth} clipHeight={viewportHeight}>
        <Group name="note-content" x={-scrollLeft} y={-scrollTop}>
          {noteBlocks}
          {children}
        </Group>
      </Group>
    </Layer>, [gridWidth, viewportHeight, scrollLeft, scrollTop, noteBlocks, children])

  const keyboardLayer = useMemo(() => <Layer name="keyboard">
      <Group y={RULER_HEIGHT} clipWidth={KEYBOARD_WIDTH} clipHeight={viewportHeight}>
        <Group name="keyboard-content" y={-scrollTop}>
          {keyboardKeys}
        </Group>
      </Group>
    </Layer>, [viewportHeight, scrollTop, keyboardKeys])

  return <Stage width={width} height={viewportHeight + RULER_HEIGHT}>
    {gridLayer}
    {notesLayer}
    {keyboardLayer}
    {selectionRectangle && <SelectionMarquee rectangle={selectionRectangle}
      viewportWidth={gridWidth} viewportHeight={viewportHeight} scrollLeft={scrollLeft} scrollTop={scrollTop} />}
    {subscribePosition && <Playhead subscribe={subscribePosition} totalTicks={totalTicks} contentWidth={contentWidth}
      scrollLeft={scrollLeft} gridWidth={gridWidth} height={viewportHeight} />}
  </Stage>
}

export default memo(RiffEditorCanvas)
