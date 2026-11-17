import { Line } from 'react-konva'
import { pianoRollTheme as theme } from './piano-roll-theme'

export type TickLineProps = {
  x?: number
  y?: number
  length: number
  variant?: 'subdivision' | 'beat' | 'bar'
  orientation?: 'vertical' | 'horizontal'
}

export function TickLine({
  x = 0, y = 0, length, variant = 'subdivision', orientation = 'vertical',
}: TickLineProps) {
  return <Line
    x={x} y={y}
    points={orientation === 'vertical' ? [0, 0, 0, length] : [0, 0, length, 0]}
    stroke={theme[variant]} strokeWidth={variant === 'bar' ? 2 : 1}
    strokeScaleEnabled={false} listening={false}
  />
}
