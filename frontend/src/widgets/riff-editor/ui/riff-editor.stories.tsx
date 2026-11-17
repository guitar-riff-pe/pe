import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import type { RiffNote } from '@entities/riffs'
import { Rect } from 'react-konva'
import { RiffEditor } from './riff-editor'

const meta = {
  title: 'Widgets/RiffEditor',
  component: RiffEditor,
  args: { height: 480, rowHeight: 20 },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <div style={{ width: '100%', maxWidth: 1200 }}><Story /></div>],
} satisfies Meta<typeof RiffEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
function InteractiveExample() {
  const [notes, setNotes] = useState<readonly RiffNote[]>([])
  return <>
    <RiffEditor onNotesChange={setNotes} />
    <details open><summary>Данные нот после завершённых действий</summary>
      <pre aria-label="Данные нот" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(notes, null, 2)}</pre>
    </details>
  </>
}
export const Interactive: Story = { render: () => <InteractiveExample /> }
export const WithNotes: Story = {
  args: { initialNotes: [
    { id: 'demo-a', pitch: 76, start: 0, duration: 480, velocity: 0.8 },
    { id: 'demo-b', pitch: 79, start: 480, duration: 240, velocity: 0.8 },
    { id: 'demo-c', pitch: 81, start: 960, duration: 960, velocity: 0.8 },
  ] },
}

const sustainedChord: RiffNote[] = [76, 79, 83].map(pitch => ({
  id: `chord-${pitch}`, pitch, start: 0, duration: 7680, velocity: 0.7,
}))

function PlaybackExample() {
  const [visible, setVisible] = useState(true)
  return <>
    <button onClick={() => setVisible(value => !value)}>{visible ? 'Закрыть редактор' : 'Открыть редактор'}</button>
    {visible && <RiffEditor initialNotes={sustainedChord} />}
  </>
}

export const Playback: Story = { render: () => <PlaybackExample /> }
export const AllFourOctaves: Story = { args: { height: 980 } }
export const Narrow: Story = {
  decorators: [(Story) => <div style={{ width: 340, maxWidth: '100%' }}><Story /></div>],
}

// Deliberately oversized notes exercise all clipping edges. These are fixtures,
// not initial riff data. The default widget is an empty canvas.
export const Clipping: Story = {
  args: {
    children: <>
      <Rect x={-40} y={-8} width={2000} height={24} fill="#adff73" stroke="#fff" />
      <Rect x={-40} y={80} width={200} height={18} fill="#adff73" />
      <Rect x={-40} y={970} width={2000} height={30} fill="#adff73" />
    </>,
  },
}
