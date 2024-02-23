import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import svgr from 'vite-plugin-svgr'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import prefixer from 'postcss-prefix-selector'
import { firefox } from '@liuli-util/vite-plugin-firefox-dist'

export default defineConfig({
  plugins: [
    preact(),
    crx({ manifest: manifest as any }),
    svgr() as any,
    firefox({
      browser_specific_settings: {
        gecko: {
          id: 'clean-twttier@rxliuli.com',
          strict_min_version: '109.0',
        },
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwind(),
        autoprefixer(),
        prefixer({ prefix: '.chatgpt-splitter' }),
      ],
    },
  },
})
