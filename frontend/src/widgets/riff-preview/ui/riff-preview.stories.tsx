import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RiffPreview } from './riff-preview'

const meta = {
  title: 'Widgets/RiffPreview',
  component: RiffPreview,
  decorators: [(Story) => <div style={{ maxWidth: 620 }}><Story /></div>],
} satisfies Meta<typeof RiffPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
