import type { CloudflareAISearchSyncOptions } from './options.js'

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
