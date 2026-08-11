import type { CloudflareAISearchSyncOptions } from './options.js'
import type { ContentSource, SourceContext, SourceFile } from './source.js'
import type { SyncItem } from './sync.js'
import { glob, readFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import Cloudflare from 'cloudflare'
import { loadEnv } from 'vite'
import { ensureIconMetadata } from './metadata.js'
import { syncItems } from './sync.js'

const excludedDirectories = [
  '.git/**',
  '.vitepress/**',
  'dist/**',
  'node_modules/**',
]

/**
 * Reads Markdown pages from a VitePress project's root directory.
 *
 * This source exposes raw Markdown files for use with the generic Vite plugin.
 */
export function vitepressSource(): ContentSource {
  return {
    read: context => readVitePressFiles(context),
  }
}

/**
 * Returns a VitePress `buildEnd` hook that syncs its resolved pages to AI Search.
 */
export function cloudflareAISearchSync(options: CloudflareAISearchSyncOptions = {}) {
  return async (siteConfig: VitePressSiteConfig): Promise<void> => {
    const environment = loadEnv('production', siteConfig.root, '')
    const accountId = options.accountId ?? environment.CLOUDFLARE_ACCOUNT_ID
    const apiToken = options.apiToken ?? environment.CLOUDFLARE_API_TOKEN
    const instanceId = options.instanceId ?? environment.CLOUDFLARE_AI_SEARCH_INSTANCE_ID
    const namespace = options.namespace ?? environment.CLOUDFLARE_AI_SEARCH_NAMESPACE

    assertCredential('accountId', 'CLOUDFLARE_ACCOUNT_ID', accountId)
    assertCredential('apiToken', 'CLOUDFLARE_API_TOKEN', apiToken)
    assertCredential('instanceId', 'CLOUDFLARE_AI_SEARCH_INSTANCE_ID', instanceId)
    assertCredential('namespace', 'CLOUDFLARE_AI_SEARCH_NAMESPACE', namespace)

    const credentials = { accountId, apiToken, instanceId, namespace }
    await ensureIconMetadata(credentials)
    const client = new Cloudflare({ apiToken })
    await syncItems(
      credentials,
      await readVitePressPages(siteConfig),
      client.aiSearch.namespaces.instances.items,
      siteConfig.logger,
    )
  }
}

interface VitePressSiteConfig {
  cleanUrls?: boolean
  logger: { info: (message: string) => void }
  pages: string[]
  rewrites: { map: Record<string, string | undefined> }
  root: string
  site: { base: string }
  srcDir: string
}

async function readVitePressPages(siteConfig: VitePressSiteConfig): Promise<SyncItem[]> {
  const pages = siteConfig.pages.map((page) => {
    const route = siteConfig.rewrites.map[page] ?? page
    return {
      key: toPublicUrl(route, siteConfig.site.base, siteConfig.cleanUrls),
      page,
    }
  }).filter(({ key }) => key !== siteRoot(siteConfig.site.base))

  return Promise.all(pages.map(async ({ key, page }) => ({
    content: await readFile(resolve(siteConfig.srcDir, page), 'utf8'),
    key,
  })))
}

function toPublicUrl(route: string, base: string, cleanUrls = false): string {
  const pathname = route.replace(/\.md$/, '')
  const publicPath = pathname === 'index'
    ? '/'
    : pathname.endsWith('/index')
      ? `/${pathname.slice(0, -'index'.length)}`
      : cleanUrls ? `/${pathname}` : `/${pathname}.html`
  return `${base.replace(/\/$/, '')}${publicPath}`
}

function siteRoot(base: string): string {
  return `${base.replace(/\/$/, '')}/`
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

async function* readVitePressFiles(context: SourceContext): AsyncIterable<SourceFile> {
  const entries: string[] = []

  for await (const entry of glob('**/*.md', {
    cwd: context.root,
    exclude: excludedDirectories,
  })) {
    entries.push(entry)
  }

  for (const entry of entries.sort()) {
    const absolutePath = resolve(context.root, entry)

    yield {
      absolutePath,
      content: await readFile(absolutePath, 'utf8'),
      relativePath: toPosixPath(relative(context.root, absolutePath)),
    }
  }
}

function toPosixPath(filePath: string): string {
  return filePath.split(sep).join('/')
}
