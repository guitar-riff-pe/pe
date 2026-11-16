import { Rect } from 'react-konva'
import { pianoRollTheme as theme } from './piano-roll-theme'

export type PianoRollRowProps = {
  x?: number
  y?: number
  width: number
  height?: number
  variant?: 'natural' | 'accidental' | 'octave'
}

export function PianoRollRow({
  x = 0, y = 0, width, height = 11, variant = 'natural',
}: PianoRollRowProps) {
  const fill = {
    natural: theme.naturalRow, accidental: theme.accidentalRow, octave: theme.octaveRow,
  }[variant]
  return <Rect x={x} y={y} width={width} height={height} fill={fill} listening={false} />
}
