export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'vite-plugin-cloudflare-ai-search-sync/nuxt',
  ],
  cloudflareAISearchSync: {},
})
