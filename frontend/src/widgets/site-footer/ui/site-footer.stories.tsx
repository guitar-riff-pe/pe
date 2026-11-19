import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SiteFooter } from './site-footer'

const meta = {
  title: 'Widgets/SiteFooter',
  component: SiteFooter,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
