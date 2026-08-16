import type { CloudflareAISearchSyncOptions } from '../options.js'
import type { VitePressSiteConfig } from './types.js'
import { loadEnv } from 'vite'
import { isSyncEnabled, resolveCredentials } from '../credentials.js'
import { synchronizeItems } from '../synchronize.js'
import { readVitePressPages } from './utils.js'

/**
 * Returns a VitePress `buildEnd` hook that syncs its resolved pages to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncOptions = {}) {
  return async (siteConfig: VitePressSiteConfig): Promise<void> => {
    const environment = loadEnv('production', siteConfig.root, '')
    if (!isSyncEnabled(options, environment))
      return

    const credentials = resolveCredentials(options, environment)

    const pages = await readVitePressPages(siteConfig)
    await synchronizeItems(credentials, pages, siteConfig.logger)
  }
}
