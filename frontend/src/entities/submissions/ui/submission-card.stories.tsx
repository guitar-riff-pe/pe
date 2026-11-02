import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Button } from '@shared/ui'
import { SubmissionCard } from './submission-card'

const meta = {
  title: 'Entities/Submissions/SubmissionCard',
  component: SubmissionCard,
  args: {
    submission: { id: 'b', title: 'Рифф B', seed: 2 },
    playing: false,
    selected: false,
    stateLabel: 'Автор скрыт',
    playAction: <Button variant="secondary" fullWidth>▶ Прослушать</Button>,
    voteAction: <Button variant="secondary" fullWidth>Выбрать рифф</Button>,
  },
} satisfies Meta<typeof SubmissionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Available: Story = {}
export const Playing: Story = { args: { playing: true } }
export const Confirmed: Story = { args: { selected: true, stateLabel: '✓ Твой выбор', voteAction: <span>✓ Голос подтверждён</span> } }
export const Locked: Story = { args: { stateLabel: 'Автор скрыт', voteAction: <Button variant="secondary" fullWidth disabled>Голос уже отдан</Button> } }
export const Own: Story = { args: { submission: { id: 'own', title: 'Твой рифф', seed: 4, own: true }, stateLabel: 'За себя голосовать нельзя', voteAction: undefined } }
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
