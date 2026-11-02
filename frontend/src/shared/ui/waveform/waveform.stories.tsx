import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Waveform } from './waveform'

const meta = { title: 'Shared/Waveform', component: Waveform, args: { bars: 90, seed: 2, maxHeight: 48 }, decorators: [(Story) => <div style={{ width: 480, height: 64 }}><Story /></div>] } satisfies Meta<typeof Waveform>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const DifferentSeed: Story = { args: { seed: 5 } }
