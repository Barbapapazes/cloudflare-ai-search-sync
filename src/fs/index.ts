import type { Plugin, ResolvedConfig } from 'vite'
import type { CloudflareAISearchSyncFsOptions } from './types.js'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { isSyncEnabled, resolveCredentials } from '../credentials.js'
import { synchronizeItems } from '../synchronize.js'
import { readMarkdownFiles } from './utils.js'

export type { CloudflareAISearchSyncFsOptions } from './types.js'

/**
 * Returns a Vite plugin that syncs Markdown files from a folder to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncFsOptions): Plugin {
  let config: ResolvedConfig

  return {
    name: 'cloudflare-ai-search-sync',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async buildEnd(error) {
      if (error)
        return

      const environment = loadEnv(config.mode, config.envDir, '')
      if (!isSyncEnabled(options, environment))
        return

      const credentials = resolveCredentials(options, environment)
      const pages = await readMarkdownFiles(
        resolve(config.root, options.folder),
        options.base ?? config.base,
        options.cleanUrls,
      )

      await synchronizeItems(credentials, pages, config.logger)
    },
  }
}
