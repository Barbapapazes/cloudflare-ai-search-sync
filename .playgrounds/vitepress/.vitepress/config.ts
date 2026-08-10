import { cloudflareAISearchSync } from 'vite-plugin-cloudflare-ai-search-sync'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Cloudflare AI Search Sync Playground',
  description: 'A VitePress fixture for the plugin.',
  vite: {
    plugins: [cloudflareAISearchSync()],
  },
})
