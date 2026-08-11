import type { Plugin, ResolvedConfig } from 'vite'
import type { CloudflareAISearchSyncFsOptions } from './types.js'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { assertCredential } from '../credentials.js'
import { ensureItemMetadata } from '../metadata.js'
import { syncItems } from '../sync.js'
import { readMarkdownFiles } from './utils.js'

/**
 * Returns a Vite plugin that syncs Markdown files from a folder to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncFsOptions): Plugin {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-cloudflare-ai-search-sync',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async buildEnd(error) {
      if (error)
        return

      const environment = loadEnv(config.mode, config.envDir, '')
      const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
      const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
      const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
      const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE

      assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
      assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
      assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
      assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

      const credentials = { accountId, apiToken, instanceId, namespace }
      const pages = await readMarkdownFiles(
        resolve(config.root, options.folder),
        options.base ?? config.base,
        options.cleanUrls,
      )

      await ensureItemMetadata(credentials)
      await syncItems(credentials, pages, config.logger)
    },
  }
}
