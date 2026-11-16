import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Outlet, useRouter, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RoomsPage } from '@pages/rooms'
import { routeTree } from './routeTree.gen'

declare global { interface Window { __roomFlowNavigate?: (href: string) => Promise<void> } }

function FlowRoot() {
  const router = useRouter()
  useEffect(() => {
    // Storybook's Link mock records clicks instead of navigating. The browser
    // check follows each rendered href through the same router instance.
    window.__roomFlowNavigate = href => router.navigate({ href })
    return () => { delete window.__roomFlowNavigate }
  }, [router])
  return <Outlet />
}

function LiveRooms() {
  return <RoomsPage code={useSearch({ strict: false }).code} />
}

const meta = {
  title: 'Flows/Rooms',
  component: LiveRooms,
  parameters: {
    layout: 'fullscreen', mockSession: false,
    tanstack: { router: {
      route: routeTree, path: '/rooms',
      routeOverrides: { __root__: { component: FlowRoot } },
      useRouterContext: () => ({ queryClient: useQueryClient() }),
    } },
  },
} satisfies Meta<typeof LiveRooms>
export default meta
type Story = StoryObj<typeof meta>
export const Live: Story = {}
