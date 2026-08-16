import vue from '@vitejs/plugin-vue'
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/fs'
import markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    markdown({}),
    vue(),
    cloudflareAISearchSync({
      cleanUrls: true,
      folder: './src/pages',
    }),
  ],
})
