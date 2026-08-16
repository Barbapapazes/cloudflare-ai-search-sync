import type { CloudflareAISearchCredentials } from './metadata.js'
import type { CloudflareAISearchSyncOptions } from './options.js'

type Environment = Record<string, string | undefined>

const enabledEnvironmentVariable = 'CLOUDFLARE_AI_SEARCH_SYNC_ENABLED'

export function isSyncEnabled(
  options: CloudflareAISearchSyncOptions,
  environment: Environment,
): boolean {
  return options.enabled ?? environment[enabledEnvironmentVariable]?.trim().toLowerCase() === 'true'
}

export function resolveCredentials(
  options: CloudflareAISearchSyncOptions,
  environment: Environment,
): CloudflareAISearchCredentials {
  const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
  const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
  const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
  const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE

  assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
  assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
  assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
  assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

  return { accountId, apiToken, instanceId, namespace }
}

export function assertCredential(
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
