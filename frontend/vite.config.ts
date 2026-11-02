import { fileURLToPath, URL } from 'node:url'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'

const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

export default defineConfig({
  resolve: {
    alias: {
      ...Object.fromEntries(
        layers.map((layer) => [
          `@${layer}`,
          fileURLToPath(new URL(`./src/${layer}`, import.meta.url)),
        ]),
      ),
      '@styles': fileURLToPath(new URL('./src/shared/config/styles', import.meta.url)),
      '@mixins': fileURLToPath(new URL('./src/shared/config/styles/_mixins.scss', import.meta.url)),
    },
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
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
})
