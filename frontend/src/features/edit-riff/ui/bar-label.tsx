import { Text } from 'react-konva'
import { pianoRollTheme as theme } from './piano-roll-theme'

export type BarLabelProps = {
  x?: number
  y?: number
  width?: number
  children: string
}

export function BarLabel({ x = 0, y = 0, width = 220, children }: BarLabelProps) {
  return <Text
    x={x} y={y} width={width} height={18} text={children}
    fontFamily={theme.fontFamily} fontSize={14} fontStyle="bold"
    fill={theme.text} listening={false}
  />
}
