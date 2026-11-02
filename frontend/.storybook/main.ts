import type { StorybookConfig } from '@storybook/tanstack-react'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/tanstack-react',
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: { viteConfigPath: './vite.config.ts' },
    },
  },
}

export default config
