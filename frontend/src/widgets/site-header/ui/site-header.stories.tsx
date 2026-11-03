import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SiteHeader } from './site-header'

const meta = {
  title: 'Widgets/SiteHeader',
  component: SiteHeader,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const OnRoomsPage: Story = { parameters: { tanstack: { router: { path: '/rooms' } } } }
export const AuthMobile: Story = {
  args: { mobileNavigation: false },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
