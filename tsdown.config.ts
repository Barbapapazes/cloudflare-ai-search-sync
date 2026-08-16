import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    fs: 'src/fs/index.ts',
    index: 'src/index.ts',
    nuxt: 'src/nuxt/index.ts',
    vitepress: 'src/vitepress/index.ts',
  },
})
