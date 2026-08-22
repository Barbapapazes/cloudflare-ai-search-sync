import type { FileAfterParseHook } from '@nuxt/content'
import type { NuxtModule } from 'nuxt/schema'
import type { SyncItem } from '../sync.js'
import type { NuxtContentSyncOptions } from './types.js'
import process from 'node:process'
import { defineNuxtModule, useLogger } from '@nuxt/kit'
import { isSyncEnabled, resolveCredentialsOrWarn } from '../credentials.js'
import { synchronizeItems } from '../synchronize.js'
import { toNuxtContentItem } from './utils.js'

export * from './types.js'

const logger = useLogger('cloudflare-ai-search-sync:nuxt')

const module: NuxtModule<NuxtContentSyncOptions> = defineNuxtModule<NuxtContentSyncOptions>({
  meta: {
    name: 'cloudflare-ai-search-sync',
    configKey: 'cloudflareAISearchSync',
    compatibility: { nuxt: '>=4.1.0 <5' },
  },
  moduleDependencies: {
    '@nuxt/content': { version: '>=3.15.2 <4' },
  },
  defaults: {
    enabled: false,
  },
  setup(options, nuxt) {
    if (nuxt.options.dev || !isSyncEnabled(options, process.env))
      return

    const credentials = resolveCredentialsOrWarn(options, process.env, logger)
    if (!credentials)
      return

    const items: SyncItem[] = []
    nuxt.hook('content:file:afterParse' as any, (context: FileAfterParseHook) => {
      if (!context)
        return

      const item = toNuxtContentItem(context, nuxt.options.rootDir, nuxt.options.app.baseURL)
      if (item)
        items.push(item)
    })
    nuxt.hook('modules:done', async () => {
      await synchronizeItems(credentials, items, logger)
    })
  },
})

export default module
