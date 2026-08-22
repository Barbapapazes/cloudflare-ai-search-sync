import type { SiteConfig } from 'vitepress'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudflareAISearchSync } from '../src/vitepress/index.js'

const { client, ensureItemMetadata, info, loadEnv, warn } = vi.hoisted(() => ({
  client: {
    createOrUpdate: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(() => ({
      async* [Symbol.asyncIterator]() {},
    })),
    upload: vi.fn(),
  },
  ensureItemMetadata: vi.fn(),
  info: vi.fn(),
  loadEnv: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('cloudflare', () => ({
  default: class {
    aiSearch = { namespaces: { instances: { items: client } } }
  },
}))

vi.mock('../src/metadata.js', () => ({ ensureItemMetadata }))
vi.mock('vite', () => ({ loadEnv }))

const temporaryDirectories: string[] = []

interface TestSiteConfig {
  logger: { info: typeof info, warn: typeof warn }
  pages: string[]
  rewrites: { map: Record<string, string | undefined> }
  root: string
  site: { base: string }
  srcDir: string
}

beforeEach(() => {
  vi.clearAllMocks()
  loadEnv.mockReturnValue({
    CLOUDFLARE_ACCOUNT_ID: 'account',
    CLOUDFLARE_AI_SEARCH_INSTANCE_ID: 'instance',
    CLOUDFLARE_AI_SEARCH_NAMESPACE: 'namespace',
    CLOUDFLARE_API_TOKEN: 'token',
  })
})

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { force: true, recursive: true })))
})

describe('cloudflareAISearchSync', () => {
  it('does not synchronize by default', async () => {
    const root = await createTemporaryDirectory()

    await cloudflareAISearchSync()(siteConfig({
      pages: [],
      rewrites: { map: {} },
      root,
      site: { base: '/' },
      srcDir: root,
      logger: { info, warn },
    }))

    expect(ensureItemMetadata).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
  })

  it('enables synchronization from the environment', async () => {
    const root = await createTemporaryDirectory()
    await writeFile(join(root, 'guide.md'), '# Guide')
    loadEnv.mockReturnValue({
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_AI_SEARCH_INSTANCE_ID: 'instance',
      CLOUDFLARE_AI_SEARCH_NAMESPACE: 'namespace',
      CLOUDFLARE_AI_SEARCH_SYNC_ENABLED: 'true',
      CLOUDFLARE_API_TOKEN: 'token',
    })

    await cloudflareAISearchSync()(siteConfig({
      pages: ['guide.md'],
      rewrites: { map: {} },
      root,
      site: { base: '/' },
      srcDir: root,
      logger: { info, warn },
    }))

    expect(ensureItemMetadata).toHaveBeenCalledOnce()
    expect(client.upload).toHaveBeenCalledOnce()
  })

  it('warns and skips synchronization when enabled without credentials', async () => {
    const root = await createTemporaryDirectory()
    loadEnv.mockReturnValue({ CLOUDFLARE_AI_SEARCH_SYNC_ENABLED: 'true' })

    await cloudflareAISearchSync()(siteConfig({
      pages: ['missing.md'],
      rewrites: { map: {} },
      root,
      site: { base: '/' },
      srcDir: root,
      logger: { info, warn },
    }))

    expect(warn).toHaveBeenCalledWith(
      '[cloudflare-ai-search-sync] Missing Cloudflare AI Search accountId. Set the "accountId" plugin option or CLOUDFLARE_ACCOUNT_ID.',
    )
    expect(ensureItemMetadata).not.toHaveBeenCalled()
    expect(client.list).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
  })

  it('excludes the site-root route from synchronization', async () => {
    const root = await createTemporaryDirectory()
    await Promise.all([
      writeFile(join(root, 'index.md'), '# Home'),
      writeFile(join(root, 'guide.md'), '# Guide'),
    ])

    await cloudflareAISearchSync({
      accountId: 'account',
      apiToken: 'token',
      enabled: true,
      instanceId: 'instance',
      namespace: 'namespace',
    })(siteConfig({
      pages: ['index.md', 'guide.md'],
      rewrites: { map: {} },
      root,
      site: { base: '/docs/' },
      srcDir: root,
      logger: { info, warn },
    }))

    expect(ensureItemMetadata).toHaveBeenCalledOnce()
    expect(client.upload).toHaveBeenCalledOnce()
    expect(client.upload.mock.calls[0][1].file.file.name).toBe('guide.md')
    expect(client.upload.mock.calls[0][1].file.metadata).toBe('{"description":"Guide","icon":"page","title":"Guide","url":"/docs/guide.html"}')
  })
})

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'cloudflare-ai-search-sync-'))
  temporaryDirectories.push(directory)
  return directory
}

function siteConfig(config: TestSiteConfig): SiteConfig {
  return config as unknown as SiteConfig
}
