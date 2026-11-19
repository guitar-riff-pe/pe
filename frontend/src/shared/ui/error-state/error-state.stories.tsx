import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ErrorState } from './error-state'

const meta = {
  title: 'Shared/ErrorState',
  component: ErrorState,
  args: { error: { message: 'Network Error' }, onRetry: () => {} },
} satisfies Meta<typeof ErrorState>
export default meta
type Story = StoryObj<typeof meta>

export const Network: Story = {}
export const Timeout: Story = { args: { error: { code: 'ETIMEDOUT' } } }
export const Server: Story = { args: { error: { status: 503 } } }
export const Unexpected: Story = { args: { error: { message: 'Internal technical details' } } }
export const Chunk: Story = { args: { error: { name: 'ChunkLoadError' } } }
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
