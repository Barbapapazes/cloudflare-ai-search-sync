import type { CloudflareAISearchSyncOptions } from '../options.js'

export interface CloudflareAISearchSyncFsOptions extends CloudflareAISearchSyncOptions {
  /** Markdown source folder, relative to the Vite project root or absolute. */
  folder: string
  /** Public URL base. Defaults to Vite's resolved base. */
  base?: string
  /** Omit `.html` from non-index Markdown URLs. */
  cleanUrls?: boolean
}
