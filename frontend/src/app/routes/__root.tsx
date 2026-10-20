import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import stylesUrl from '../styles/global.scss?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'PE · Monorepo' },
    ],
    links: [{ rel: 'stylesheet', href: stylesUrl }],
  }),
  component: Root,
  notFoundComponent: () => <main><h1>Страница не найдена</h1><a href="/">На главную</a></main>,
})

function Root() {
  return (
    <html lang="ru">
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  )
}
