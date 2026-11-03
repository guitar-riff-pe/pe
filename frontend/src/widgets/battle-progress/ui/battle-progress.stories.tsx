import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { BattleProgress } from './battle-progress'

const meta = { title: 'Widgets/Battle Progress', component: BattleProgress, args: { stage: 3 } } satisfies Meta<typeof BattleProgress>
export default meta
type Story = StoryObj<typeof meta>
export const Voting: Story = {}
export const Lobby: Story = { args: { stage: 1 } }
export const ResultsMobile: Story = { args: { stage: 4 }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
