import { fileURLToPath, URL } from 'node:url'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'

const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      layers.map((layer) => [
        `@${layer}`,
        fileURLToPath(new URL(`./src/${layer}`, import.meta.url)),
      ]),
    ),
  },
  plugins: [
    tanstackStart({
      router: {
        routesDirectory: './app/routes',
        generatedRouteTree: './app/routeTree.gen.ts',
      },
    }),
    nitro({ preset: 'node-server' }),
    react(),
  ],
  server: { port: 3000, strictPort: true },
})
