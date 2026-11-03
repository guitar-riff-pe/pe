import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Surface } from './surface'

const meta = {
  title: 'Shared/UI/Surface',
  component: Surface,
  args: {
    children: <><h2 style={{ marginTop: 0 }}>Источник звука</h2><p>Микрофон или звуковая карта</p></>,
  },
  decorators: [(Story) => <div style={{ maxWidth: 520 }}><Story /></div>],
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Compact: Story = { args: { padding: 'compact' } }
