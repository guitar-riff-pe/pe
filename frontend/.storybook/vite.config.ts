import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

export default defineConfig({
  server: {
    watch: { ignored: ['**/storybook-static/**'] },
  },
  resolve: {
    alias: {
      ...Object.fromEntries(
        layers.map((layer) => [
          `@${layer}`,
          fileURLToPath(new URL(`../src/${layer}`, import.meta.url)),
        ]),
      ),
      '@styles': fileURLToPath(new URL('../src/shared/config/styles', import.meta.url)),
      '@mixins': fileURLToPath(new URL('../src/shared/config/styles/_mixins.scss', import.meta.url)),
    },
  },
})
