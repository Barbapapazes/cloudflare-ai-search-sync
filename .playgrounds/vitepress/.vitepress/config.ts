import process from 'node:process'
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/vitepress'
import { defineConfig } from 'vitepress'
import { cloudflareAISearch } from 'vitepress-plugin-cloudflare-ai-search'

export default defineConfig({
  title: 'Cloudflare AI Search Sync Playground',
  description: 'A VitePress fixture for the plugin.',
  buildEnd: cloudflareAISearchSync({
    enabled: process.env.CI !== 'true',
  }),
  vite: {
    plugins: [
      cloudflareAISearch({
        endpoint: 'https://search.vpcass-vitepress.barbapapazes.dev',
      }),
    ],
  },
})
