import { memo, useEffect, useRef } from 'react'
import { Group, Layer, Line } from 'react-konva'
import type Konva from 'konva'
import type { SubscribePosition } from '@shared/lib/playback-position'
import { GRID_X, RULER_HEIGHT } from '../lib/piano-roll-layout'

export const Playhead = memo(function Playhead({ subscribe, totalTicks, contentWidth, scrollLeft, gridWidth, height }: {
  subscribe: SubscribePosition; totalTicks: number; contentWidth: number; scrollLeft: number; gridWidth: number; height: number
}) {
  const line = useRef<Konva.Line>(null)
  useEffect(() => subscribe(ticks => {
    const node = line.current
    if (!node) return
    node.visible(ticks !== null)
    if (ticks !== null) node.x(ticks / totalTicks * contentWidth - scrollLeft)
    node.getLayer()?.batchDraw()
  }), [subscribe, totalTicks, contentWidth, scrollLeft])
  return <Layer name="playhead" listening={false}>
    <Group x={GRID_X} y={RULER_HEIGHT} clipWidth={gridWidth} clipHeight={height}>
      <Line ref={line} name="playhead-line" points={[0, 0, 0, height]} stroke="#f2f3f5" strokeWidth={2} />
    </Group>
  </Layer>
})
