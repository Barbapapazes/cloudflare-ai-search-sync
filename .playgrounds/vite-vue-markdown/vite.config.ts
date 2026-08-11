import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'
import { cloudflareAISearchSync } from 'vite-plugin-cloudflare-ai-search-sync'

export default defineConfig({
  plugins: [
    Markdown(),
    vue(),
    cloudflareAISearchSync({
      cleanUrls: true,
      folder: './src/pages',
    }),
  ],
})
