import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RecoveryForm, SignInForm } from '@features/account-access'
import { AuthLayout } from './auth-layout'

const meta = {
  title: 'Widgets/AuthLayout',
  component: AuthLayout,
  args: { children: <SignInForm /> },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AuthLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Split: Story = {}
export const SplitMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const Centered: Story = { args: { centered: true, children: <RecoveryForm /> } }
