import { memo, type ComponentProps } from 'react'
import { Rect } from 'react-konva'
import { pianoRollTheme as theme } from './piano-roll-theme'

export type NoteBlockProps = Pick<ComponentProps<typeof Rect>,
  'id' | 'x' | 'y' | 'width' | 'height' | 'draggable' | 'dragBoundFunc' |
  'onClick' | 'onTap' | 'onPointerDown' | 'onPointerUp' |
  'onDragStart' | 'onDragMove' | 'onDragEnd'
> & { selected?: boolean }

export const NoteBlock = memo(function NoteBlock({
  width = 63.75, height = 9, selected = false, ...props
}: NoteBlockProps) {
  return <Rect
    {...props} width={width} height={height}
    fill={theme.note} stroke={selected ? theme.focus : theme.note}
    strokeWidth={1} strokeScaleEnabled={false} cornerRadius={2}
  />
})
