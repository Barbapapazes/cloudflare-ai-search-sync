import type { CloudflareAISearchSyncOptions } from '../options.js'

export interface NuxtContentFile {
  body: string
  extension?: string
  path: string
}

export interface NuxtContentDocument {
  description?: unknown
  draft?: unknown
  extension?: string
  meta?: { draft?: unknown }
  path?: string
  title?: unknown
}

export interface NuxtContentAfterParseContext {
  collection?: { type?: string }
  content: NuxtContentDocument
  file: NuxtContentFile
}

export interface NuxtContentSyncOptions extends CloudflareAISearchSyncOptions {}

export interface NuxtContentSyncNuxt {
  hook: (name: string, handler: (context?: NuxtContentAfterParseContext) => void | Promise<void>) => void
  logger: { info: (message: string) => void }
  options: {
    app: { baseURL: string }
    dev: boolean
    rootDir: string
  }
}
