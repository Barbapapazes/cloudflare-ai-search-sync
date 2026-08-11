import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    nuxt: 'src/nuxt/index.ts',
    vitepress: 'src/vitepress/index.ts',
  },
})
