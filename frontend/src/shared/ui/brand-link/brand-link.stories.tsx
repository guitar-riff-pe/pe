import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { BrandLink } from './brand-link'

const meta = { title: 'Shared/Brand Link', component: BrandLink, parameters: { tanstack: { router: { path: '/' } } } } satisfies Meta<typeof BrandLink>
export default meta
type Story = StoryObj<typeof meta>
export const Accent: Story = {}
export const Monochrome: Story = { args: { monochrome: true } }
