import type { CloudflareAISearchSyncOptions } from '../options.js'
import type { VitePressSiteConfig } from './types.js'
import { loadEnv } from 'vite'
import { assertCredential } from '../credentials.js'
import { ensureItemMetadata } from '../metadata.js'
import { syncItems } from '../sync.js'
import { readVitePressPages } from './utils.js'

/**
 * Returns a VitePress `buildEnd` hook that syncs its resolved pages to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncOptions = {}) {
  return async (siteConfig: VitePressSiteConfig): Promise<void> => {
    const environment = loadEnv('production', siteConfig.root, '')
    const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
    const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
    const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
    const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE

    assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
    assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
    assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
    assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

    const credentials = { accountId, apiToken, instanceId, namespace }

    await ensureItemMetadata(credentials)

    const pages = await readVitePressPages(siteConfig)
    await syncItems(
      credentials,
      pages,
      siteConfig.logger,
    )
  }
}
