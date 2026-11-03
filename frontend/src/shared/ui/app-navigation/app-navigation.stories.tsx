import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { AppNavigation } from './app-navigation'

const meta = { title: 'Shared/App Navigation', component: AppNavigation, parameters: { tanstack: { router: { path: '/rooms' } } } } satisfies Meta<typeof AppNavigation>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { args: { mobile: true }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
