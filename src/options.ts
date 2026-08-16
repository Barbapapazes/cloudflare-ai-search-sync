export interface CloudflareAISearchSyncOptions {
  /** Enables synchronization. Defaults to CLOUDFLARE_AI_SEARCH_SYNC_ENABLED, then false. */
  enabled?: boolean
  /** Cloudflare account ID. Defaults to CLOUDFLARE_ACCOUNT_ID. */
  accountId?: string
  /** Cloudflare API token. Defaults to CLOUDFLARE_API_TOKEN. */
  apiToken?: string
  /** AI Search instance ID. Defaults to CLOUDFLARE_AI_SEARCH_INSTANCE_ID. */
  instanceId?: string
  /** Required AI Search namespace. Defaults to CLOUDFLARE_AI_SEARCH_NAMESPACE. */
  namespace?: string
}
