import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudflareAISearchSync } from '../src/vitepress/index.js'

const { client, ensureItemMetadata, info } = vi.hoisted(() => ({
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
}))

vi.mock('cloudflare', () => ({
  default: class {
    aiSearch = { namespaces: { instances: { items: client } } }
  },
}))

vi.mock('../src/metadata.js', () => ({ ensureItemMetadata }))

const temporaryDirectories: string[] = []

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { force: true, recursive: true })))
})

describe('cloudflareAISearchSync', () => {
  it('excludes the site-root route from synchronization', async () => {
    const root = await createTemporaryDirectory()
    await Promise.all([
      writeFile(join(root, 'index.md'), '# Home'),
      writeFile(join(root, 'guide.md'), '# Guide'),
    ])

    await cloudflareAISearchSync({
      accountId: 'account',
      apiToken: 'token',
      instanceId: 'instance',
      namespace: 'namespace',
    })({
      pages: ['index.md', 'guide.md'],
      rewrites: { map: {} },
      root,
      site: { base: '/docs/' },
      srcDir: root,
      logger: { info },
    })

    expect(ensureItemMetadata).toHaveBeenCalledOnce()
    expect(client.upload).toHaveBeenCalledOnce()
    expect(client.upload.mock.calls[0][1].file.file.name).toBe('guide.md')
    expect(client.upload.mock.calls[0][1].file.metadata).toBe('{"url":"/docs/guide.html"}')
  })
})

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'cloudflare-ai-search-sync-'))
  temporaryDirectories.push(directory)
  return directory
}
