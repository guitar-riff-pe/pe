import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RoomsPage } from './rooms-page'

const meta = {
  title: 'Pages/Rooms',
  component: RoomsPage,
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/rooms' } } },
} satisfies Meta<typeof RoomsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
