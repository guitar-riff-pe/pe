import type { Preview } from '@storybook/tanstack-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import '../src/app/styles/global.scss'

function Queries({ children, mockSession }: { children: ReactNode; mockSession: boolean }) {
  const [client] = useState(() => {
    const instance = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    if (mockSession) instance.setQueryData(['session'], null, { updatedAt: Date.now() + 86_400_000 })
    return instance
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const preview: Preview = {
  decorators: [(Story, context) => <Queries mockSession={context.parameters.mockSession !== false}><Story /></Queries>],
  parameters: {
    layout: 'padded',
  },
}

export default preview
