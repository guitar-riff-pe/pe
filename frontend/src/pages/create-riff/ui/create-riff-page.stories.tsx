import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { encodeRiff, type RiffNote } from '@entities/riffs'
import type { ComposingRound } from '@entities/rounds'
import { CreateRiffPage, CreateRiffWorkspace } from './create-riff-page'

const notes: RiffNote[] = [
  { id: 'a', pitch: 64, start: 0, duration: 480, velocity: .8 },
  { id: 'b', pitch: 67, start: 480, duration: 360, velocity: .8 },
  { id: 'c', pitch: 69, start: 960, duration: 480, velocity: .8 },
  { id: 'd', pitch: 64, start: 1920, duration: 480, velocity: .8 },
  { id: 'e', pitch: 71, start: 2400, duration: 480, velocity: .8 },
  { id: 'f', pitch: 69, start: 2880, duration: 960, velocity: .8 },
]

function round(seconds = 272, bars = 4): ComposingRound {
  return {
    id: 'storybook-round', room_id: 'storybook-room', number: 1, stage: seconds ? 'composing' : 'voting',
    bars, bpm: bars === 8 ? 155 : 120,
    loop_title: bars === 8 ? 'Бласт' : 'Полиритмия',
    loop_url: `/sounds/drums/${bars === 8 ? 'blast-155-8' : 'poly-120-4'}.wav`,
    server_now: new Date().toISOString(), composing_ends_at: new Date(Date.now() + seconds * 1000).toISOString(),
    own_riff: null,
  }
}

const meta = {
  title: 'Pages/CreateRiff',
  component: CreateRiffWorkspace,
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms/compose' }, path: '/rooms/compose' } } },
} satisfies Meta<typeof CreateRiffWorkspace>
export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = { render: () => <CreateRiffWorkspace round={round()} initialDraft={{ notes, timbre: 'distortion' }} onSave={async () => {}} /> }
export const Empty: Story = { render: () => <CreateRiffWorkspace round={round()} onSave={async () => {}} /> }
export const Mobile: Story = { ...Desktop, globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const EightBars: Story = { render: () => <CreateRiffWorkspace round={round(272, 8)} initialDraft={{ notes: [...notes, { ...notes[0], id: 'late', start: 13440 }], timbre: 'clean' }} onSave={async () => {}} /> }
export const Saved: Story = { render: () => <CreateRiffWorkspace round={{ ...round(), own_riff: { ...encodeRiff(notes, 'clean'), id: 'saved', updated_at: new Date().toISOString() } }} initialDraft={{ notes, timbre: 'clean' }} onSave={async () => {}} /> }
export const Deadline: Story = { render: () => <CreateRiffWorkspace round={round(3)} initialDraft={{ notes, timbre: 'clean' }} onSave={async () => {}} /> }
export const Closed: Story = { render: () => <CreateRiffWorkspace round={round(0)} initialDraft={{ notes, timbre: 'clean' }} /> }
export const SaveError: Story = { render: () => <CreateRiffWorkspace round={round()} initialDraft={{ notes, timbre: 'clean' }} onSave={async () => { throw new Error('Нет соединения с сервером. Попробуй ещё раз.') }} /> }
export const LocalDraft: Story = { render: () => <CreateRiffPage /> }
export const ConnectedRound: Story = { render: () => <CreateRiffPage roundId="00000000-0000-4000-8000-000000000001" /> }
