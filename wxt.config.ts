import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  runner: {
    disabled: true,
  },
  manifest: {
    name: 'LLM Splitter',
    description: 'Automatically splits long texts and inputs them into ChatGPT',
    permissions: ['activeTab'],
    action: {
      default_title: 'Show Split Modal',
      default_icon: {
        '16': 'icon/icon-16.png',
        '48': 'icon/icon-48.png',
        '128': 'icon/icon-128.png',
        '512': 'icon/icon-512.png',
      },
    },
  },
})
