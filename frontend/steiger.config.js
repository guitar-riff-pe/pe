import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // TanStack Start requires this entry point outside the FSD app layer.
    ignores: ['./src/router.tsx', './src/app/routeTree.gen.ts'],
  },
  {
    rules: {
      'fsd/forbidden-imports': 'error',
      'fsd/no-public-api-sidestep': 'error',
      'fsd/public-api': 'error',
      'fsd/import-locality': 'error',
      'fsd/no-wildcard-exports': 'error',
      // A small starter may have slices with only one consumer.
      'fsd/insignificant-slice': 'off',
    },
  },
])
