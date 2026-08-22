import type { SiteConfig } from 'vitepress'
import type { CloudflareAISearchSyncOptions } from '../options.js'
import { loadEnv } from 'vite'
import { isSyncEnabled, resolveCredentialsOrWarn } from '../credentials.js'
import { synchronizeItems } from '../synchronize.js'
import { readVitePressPages } from './utils.js'

/**
 * Returns a VitePress `buildEnd` hook that syncs its resolved pages to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncOptions = {}) {
  return async (siteConfig: SiteConfig): Promise<void> => {
    const environment = loadEnv('production', siteConfig.root, '')
    if (!isSyncEnabled(options, environment))
      return

    const credentials = resolveCredentialsOrWarn(options, environment, siteConfig.logger)
    if (!credentials)
      return

    const pages = await readVitePressPages(siteConfig)
    await synchronizeItems(credentials, pages, siteConfig.logger)
  }
}
