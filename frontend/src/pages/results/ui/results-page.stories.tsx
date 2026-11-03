import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ResultsPage } from './results-page'

const meta = {
  title: 'Pages/Results',
  component: ResultsPage,
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/rooms/results' } } },
} satisfies Meta<typeof ResultsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
