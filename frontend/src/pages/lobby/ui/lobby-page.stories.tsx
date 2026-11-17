import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { LobbyPageView } from './lobby-page'
import { demoLobby } from '../model/demo-lobby'

const meta = {
  title: 'Pages/Lobby',
  component: LobbyPageView,
  args: { room: demoLobby, onStart: () => {}, onLeave: () => {} },
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms/lobby' }, path: '/rooms/lobby' } } },
} satisfies Meta<typeof LobbyPageView>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const WaitingForPlayers: Story = { args: { room: { ...demoLobby, participants: [demoLobby.participants[0], ...Array.from({ length: 3 }, (_, index) => ({ id: `free-${index}`, name: 'Ожидаем игрока', role: 'empty' as const }))] } } }
export const Guest: Story = { args: { room: { ...demoLobby, participants: demoLobby.participants.map(participant => ({ ...participant, isSelf: participant.id === 'guitar' })) } } }
