import type { CloudflareAISearchCredentials } from './metadata.js'
import type { CloudflareAISearchSyncOptions } from './options.js'

type Environment = Record<string, string | undefined>

interface WarningLogger {
  warn: (message: string) => void
}

const enabledEnvironmentVariable = 'CLOUDFLARE_AI_SEARCH_SYNC_ENABLED'

export function isSyncEnabled(
  options: CloudflareAISearchSyncOptions,
  environment: Environment,
): boolean {
  return options.enabled ?? environment[enabledEnvironmentVariable]?.trim().toLowerCase() === 'true'
}

export function resolveCredentialsOrWarn(
  options: CloudflareAISearchSyncOptions,
  environment: Environment,
  logger: WarningLogger,
): CloudflareAISearchCredentials | undefined {
  const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
  if (!accountId?.trim())
    return warnMissingCredential(logger, 'accountId', 'CLOUDFLARE_ACCOUNT_ID')

  const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
  if (!apiToken?.trim())
    return warnMissingCredential(logger, 'apiToken', 'CLOUDFLARE_API_TOKEN')

  const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
  if (!instanceId?.trim())
    return warnMissingCredential(logger, 'instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID')

  const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE
  if (!namespace?.trim())
    return warnMissingCredential(logger, 'namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE')

  return { accountId, apiToken, instanceId, namespace }
}

function warnMissingCredential(
  logger: WarningLogger,
  optionName: keyof CloudflareAISearchSyncOptions,
  environmentName: string,
): undefined {
  logger.warn(
    `[cloudflare-ai-search-sync] Missing Cloudflare AI Search ${optionName}. Set the "${optionName}" plugin option or ${environmentName}.`,
  )
}
