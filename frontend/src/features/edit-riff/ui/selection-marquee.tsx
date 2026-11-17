import { memo } from 'react'
import { Group, Layer, Rect } from 'react-konva'
import type { SelectionRectangle } from '../lib/marquee-selection'
import { GRID_X, RULER_HEIGHT } from '../lib/piano-roll-layout'
import { pianoRollTheme } from './piano-roll-theme'

export type SelectionMarqueeProps = {
  rectangle: SelectionRectangle
  viewportWidth: number
  viewportHeight: number
  scrollLeft: number
  scrollTop: number
}

/** A separate overlay canvas, clipped to the tracks and transparent to input. */
export const SelectionMarquee = memo(function SelectionMarquee({
  rectangle, viewportWidth, viewportHeight, scrollLeft, scrollTop,
}: SelectionMarqueeProps) {
  return <Layer name="selection" listening={false}>
    <Group x={GRID_X} y={RULER_HEIGHT} clipWidth={viewportWidth} clipHeight={viewportHeight}>
      <Group x={-scrollLeft} y={-scrollTop}>
        <Rect name="selection-marquee" {...rectangle}
          fill="rgba(145, 200, 255, 0.12)" stroke={pianoRollTheme.focus}
          strokeWidth={1} strokeScaleEnabled={false} dash={[6, 4]} />
      </Group>
    </Group>
  </Layer>
})
