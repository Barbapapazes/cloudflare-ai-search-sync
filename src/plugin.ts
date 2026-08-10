import type { Plugin } from 'vite'

/**
 * Creates the Cloudflare AI Search synchronization plugin.
 *
 * Synchronization behavior will be added in a future release.
 */
export function cloudflareAISearchSync(): Plugin {
  return {
    name: 'vite-plugin-cloudflare-ai-search-sync',
  }
}
