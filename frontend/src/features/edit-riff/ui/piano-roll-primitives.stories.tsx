import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Group, Layer, Stage } from 'react-konva'
import { PianoKey } from './piano-key'
import { NoteBlock } from './note-block'
import { TickLine } from './tick-line'
import { PianoRollRow } from './piano-roll-row'
import { BarLabel } from './bar-label'

const meta = {
  title: 'Features/Edit riff/Piano roll primitives',
  component: PianoKey,
  args: { x: 16, y: 32 },
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div style={{ maxWidth: '100%', overflowX: 'auto', background: '#0b0e12' }}>
    <Stage width={1152} height={340}><Layer><Story /></Layer></Stage>
  </div>],
} satisfies Meta<typeof PianoKey>

export default meta
type Story = StoryObj<typeof meta>

export const NaturalKey: Story = {}
export const AccidentalKey: Story = { args: { variant: 'accidental' } }
export const OctaveKey: Story = { args: { variant: 'octave', label: 'C4' } }
export const ActiveKey: Story = { args: { active: true } }

export const Note: Story = {
  render: () => <NoteBlock x={16} y={32} />,
}
export const SelectedNote: Story = {
  render: () => <NoteBlock x={16} y={32} selected />,
}
export const TickLines: Story = {
  render: () => <>
    <TickLine x={16} y={32} length={120} />
    <TickLine x={80} y={32} length={120} variant="beat" />
    <TickLine x={144} y={32} length={120} variant="bar" />
    <TickLine x={16} y={180} length={128} orientation="horizontal" />
  </>,
}
export const Rows: Story = {
  render: () => <>
    <PianoRollRow x={16} y={32} width={400} variant="octave" />
    <PianoRollRow x={16} y={43} width={400} variant="natural" />
    <PianoRollRow x={16} y={54} width={400} variant="accidental" />
  </>,
}
export const BarLabels: Story = {
  render: () => <BarLabel x={16} y={32}>Такт 1</BarLabel>,
}

// The composition lives only in Storybook. Production primitives accept pixel
// coordinates; MIDI data, selection and editing will belong to the editor model.
export const FigmaComposition: Story = {
  render: () => {
    const width = 1052
    const rowHeight = 11
    const height = rowHeight * 25
    const stepWidth = width / 64
    const rows = Array.from({ length: 25 }, (_, index) => {
      const pitch = 72 - index
      const accidental = [1, 3, 6, 8, 10].includes(pitch % 12)
      const variant = pitch % 12 === 0 ? 'octave' : accidental ? 'accidental' : 'natural'
      return { pitch, variant, y: index * rowHeight } as const
    })
    const notes = [
      [0, 7, 4], [4, 10, 3], [8, 12, 4], [16, 7, 4],
      [20, 12, 4], [24, 14, 4], [32, 7, 4], [36, 10, 4],
      [40, 12, 4], [48, 16, 4], [52, 14, 4], [56, 12, 8],
    ]

    return <Group x={16} y={16}>
      {Array.from({ length: 4 }, (_, index) => <BarLabel
        key={index} x={76 + index * width / 4} y={0}
      >{`Такт ${index + 1}`}</BarLabel>)}
      <Group y={32}>
        {rows.filter(row => row.variant !== 'octave').map(row => <PianoKey
          key={row.pitch} y={row.y} variant={row.variant}
        />)}
        {rows.filter(row => row.variant === 'octave').map(row => <PianoKey
          key={row.pitch} y={row.y - 2} variant="octave"
          label={`C${Math.floor(row.pitch / 12) - 1}`}
        />)}
      </Group>
      <Group x={68} y={32}>
        {rows.map(row => <PianoRollRow
          key={row.pitch} y={row.y} width={width} variant={row.variant}
        />)}
        {Array.from({ length: 26 }, (_, index) => <TickLine
          key={`row-${index}`} y={index * rowHeight} length={width} orientation="horizontal"
          variant={index % 12 === 0 ? 'beat' : 'subdivision'}
        />)}
        {Array.from({ length: 65 }, (_, index) => <TickLine
          key={`tick-${index}`} x={index * stepWidth} length={height}
          variant={index % 16 === 0 ? 'bar' : index % 4 === 0 ? 'beat' : 'subdivision'}
        />)}
        {notes.map(([step, pitchOffset, duration], index) => <NoteBlock
          key={step} x={step * stepWidth + 1} y={(24 - pitchOffset) * rowHeight + 1}
          width={duration * stepWidth - 2} selected={index === 4}
        />)}
      </Group>
    </Group>
  },
}
