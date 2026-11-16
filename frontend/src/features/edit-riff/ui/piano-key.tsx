import type { ComponentProps } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { pianoRollTheme as theme } from './piano-roll-theme'

export type PianoKeyProps = Pick<ComponentProps<typeof Group>,
  'x' | 'y' | 'onPointerDown' | 'onPointerUp' | 'onPointerLeave' | 'onClick' | 'onTap'
> & {
  variant?: 'natural' | 'accidental' | 'octave'
  width?: number
  height?: number
  label?: string
  active?: boolean
}

export function PianoKey({
  variant = 'natural', width = 60, height = variant === 'octave' ? 18 : 10,
  label, active = false, ...props
}: PianoKeyProps) {
  const fill = active ? theme.focus : {
    natural: theme.naturalKey, accidental: theme.accidentalKey, octave: theme.octaveKey,
  }[variant]

  return <Group {...props}>
    <Rect
      width={width} height={height} fill={fill}
      stroke={variant === 'octave' ? theme.focus : theme.subdivision}
      strokeWidth={1} strokeEnabled={!active} strokeScaleEnabled={false}
    />
    {label && <Text
      text={label} x={8} width={Math.max(1, width - 12)} height={height}
      fontFamily={theme.fontFamily} fontSize={Math.max(8, Math.min(14, height - 3))} fontStyle="bold"
      verticalAlign="middle" fill={active || variant === 'natural' ? theme.accidentalRow : theme.text}
      listening={false}
    />}
  </Group>
}
