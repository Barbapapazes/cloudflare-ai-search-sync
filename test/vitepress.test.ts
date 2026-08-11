import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudflareAISearchSync, vitepressSource } from '../src/vitepress.js'

const { client, ensureIconMetadata, info } = vi.hoisted(() => ({
  client: {
    createOrUpdate: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(() => ({
      async* [Symbol.asyncIterator]() {},
    })),
    upload: vi.fn(),
  },
  ensureIconMetadata: vi.fn(),
  info: vi.fn(),
}))

vi.mock('cloudflare', () => ({
  default: class {
    aiSearch = { namespaces: { instances: { items: client } } }
  },
}))

vi.mock('../src/metadata.js', () => ({ ensureIconMetadata }))

const temporaryDirectories: string[] = []

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { force: true, recursive: true })))
})

describe('vitepressSource', () => {
  it('reads Markdown files in deterministic order and skips generated directories', async () => {
    const root = await createTemporaryDirectory()
    await Promise.all([
      writeFile(join(root, 'z.md'), '# Z'),
      mkdir(join(root, 'guide'), { recursive: true }),
      mkdir(join(root, '.vitepress'), { recursive: true }),
      mkdir(join(root, 'dist'), { recursive: true }),
      mkdir(join(root, 'node_modules', 'dependency'), { recursive: true }),
    ])
    await Promise.all([
      writeFile(join(root, 'guide', 'a.md'), '# A'),
      writeFile(join(root, '.vitepress', 'ignored.md'), '# Ignored'),
      writeFile(join(root, 'dist', 'ignored.md'), '# Ignored'),
      writeFile(join(root, 'node_modules', 'dependency', 'ignored.md'), '# Ignored'),
    ])

    const files = []
    for await (const file of vitepressSource().read({ root })) {
      files.push(file)
    }

    expect(files).toEqual([
      {
        absolutePath: join(root, 'guide', 'a.md'),
        content: '# A',
        relativePath: 'guide/a.md',
      },
      {
        absolutePath: join(root, 'z.md'),
        content: '# Z',
        relativePath: 'z.md',
      },
    ])
  })
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

    expect(ensureIconMetadata).toHaveBeenCalledOnce()
    expect(client.upload).toHaveBeenCalledOnce()
    expect(client.upload.mock.calls[0][1].file.file.name).toBe('/docs/guide.html')
  })
})

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'cloudflare-ai-search-sync-'))
  temporaryDirectories.push(directory)
  return directory
}
