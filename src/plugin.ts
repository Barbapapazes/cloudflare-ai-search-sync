import type { Plugin } from 'vite'
import type { CloudflareAISearchSyncOptions } from './options.js'
import Cloudflare from 'cloudflare'
import { loadEnv } from 'vite'
import { ensureIconMetadata } from './metadata.js'
import { syncItems } from './sync.js'

/**
 * Configures the Cloudflare AI Search icon metadata and synchronizes an
 * optional content source during production builds.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncOptions = {}): Plugin {
  let mode = ''
  let root = ''

  return {
    name: 'vite-plugin-cloudflare-ai-search-sync',
    apply(config, environment) {
      return environment.command === 'build' && environment.mode === 'production'
    },
    configResolved(config) {
      mode = config.mode
      root = config.root
    },
    async buildStart() {
      const environment = loadEnv(mode, root, '')
      const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
      const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
      const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
      const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE

      assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
      assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
      assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
      assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

      await ensureIconMetadata({ accountId, apiToken, instanceId, namespace })

      if (options.source) {
        const items = []
        for await (const file of options.source.read({ root })) {
          items.push({ content: file.content, key: file.relativePath })
        }

        const client = new Cloudflare({ apiToken })
        await syncItems(
          { accountId, apiToken, instanceId, namespace },
          items,
          client.aiSearch.namespaces.instances.items,
          { info: message => this.info(message) },
        )
      }
    },
  }
}

function assertCredential(
  optionName: keyof CloudflareAISearchSyncOptions,
  environmentName: string,
  value: string | undefined,
): asserts value is string {
  if (!value?.trim()) {
    throw new Error(
      `Missing Cloudflare AI Search ${optionName}. Set the "${optionName}" plugin option or ${environmentName}.`,
    )
  }
}
