import type { NuxtModule } from 'nuxt/schema'
import type { SyncItem } from '../sync.js'
import type { NuxtContentSyncNuxt, NuxtContentSyncOptions } from './types.js'
import process from 'node:process'
import { defineNuxtModule } from '@nuxt/kit'
import { assertCredential } from '../credentials.js'
import { ensureItemMetadata } from '../metadata.js'
import { syncItems } from '../sync.js'
import { toNuxtContentItem } from './utils.js'

export * from './types.js'

const module: NuxtModule<NuxtContentSyncOptions> = defineNuxtModule<NuxtContentSyncOptions>({
  meta: {
    name: 'vite-plugin-cloudflare-ai-search-sync',
    configKey: 'cloudflareAISearchSync',
    compatibility: { nuxt: '>=4.1.0 <5' },
  },
  moduleDependencies: {
    '@nuxt/content': { version: '>=3.15.2 <4' },
  },
  setup(options: NuxtContentSyncOptions, nuxt: unknown) {
    registerNuxtContentSync(options, nuxt as unknown as NuxtContentSyncNuxt)
  },
})

export default module

/** Registers production-only Nuxt Content synchronization hooks. */
export function registerNuxtContentSync(
  options: NuxtContentSyncOptions,
  nuxt: NuxtContentSyncNuxt,
): void {
  if (nuxt.options.dev)
    return

  const items: SyncItem[] = []
  nuxt.hook('content:file:afterParse', (context) => {
    if (!context)
      return

    const item = toNuxtContentItem(context, nuxt.options.rootDir, nuxt.options.app.baseURL)
    if (item)
      items.push(item)
  })
  nuxt.hook('modules:done', async () => {
    const credentials = resolveCredentials(options)
    await ensureItemMetadata(credentials)
    await syncItems(credentials, items, nuxt.logger)
  })
}

function resolveCredentials(options: NuxtContentSyncOptions) {
  const accountId = options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN
  const instanceId = options.instanceId ?? process.env.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
  const namespace = options.namespace ?? process.env.CLOUDFLARE_AI_SEARCH_NAMESPACE

  assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
  assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
  assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
  assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

  return { accountId, apiToken, instanceId, namespace }
}
