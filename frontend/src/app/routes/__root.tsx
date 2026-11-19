import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation } from '@tanstack/react-router'
import { ErrorBoundary, ErrorState } from '@shared/ui'
import stylesUrl from '../styles/global.scss?url'
import { SiteLayout } from '../layouts/site-layout'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Riff Battle — гитарные баттлы' },
      { name: 'description', content: 'Создайте гитарный рифф под общий бит, пригласите друзей и выберите лучший в музыкальном баттле.' },
    ],
    links: [{ rel: 'stylesheet', href: stylesUrl }],
  }),
  shellComponent: Root,
  component: Outlet,
  notFoundComponent: () => <main><ErrorState error={{ status: 404 }} /></main>,
})

function Root({ children }: { children: ReactNode }) {
  const href = useLocation({ select: location => location.href })
  return (
    <html lang="ru">
      <head><HeadContent /></head>
      <body>
        <ErrorBoundary resetKey={href}>
          <SiteLayout>{children}</SiteLayout>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
