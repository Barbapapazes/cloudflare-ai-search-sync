import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudflareAISearchSync } from '../src/index.js'

const { client, ensureItemMetadata, info, loadEnv } = vi.hoisted(() => ({
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
}))

vi.mock('cloudflare', () => ({
  default: class {
    aiSearch = { namespaces: { instances: { items: client } } }
  },
}))

vi.mock('vite', () => ({ loadEnv }))
vi.mock('../src/metadata.js', () => ({ ensureItemMetadata }))

const temporaryDirectories: string[] = []

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
  it('only runs during builds and skips failed builds', async () => {
    const plugin = testPlugin(cloudflareAISearchSync({ folder: 'content' }))

    expect(plugin.apply).toBe('build')
    await plugin.buildEnd(new Error('build failed'))

    expect(loadEnv).not.toHaveBeenCalled()
    expect(ensureItemMetadata).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
  })

  it('syncs Markdown files recursively, including the root index page', async () => {
    const root = await createTemporaryDirectory()
    const content = join(root, 'content')
    await mkdir(join(content, 'guide'), { recursive: true })
    await Promise.all([
      writeFile(join(content, 'about.md'), '# About'),
      writeFile(join(content, 'guide', 'index.md'), '# Guide'),
      writeFile(join(content, 'guide', 'intro.md'), '# Intro'),
      writeFile(join(content, 'index.md'), '# Home'),
      writeFile(join(content, 'ignored.txt'), 'ignored'),
    ])

    const plugin = cloudflareAISearchSync({ folder: 'content' })
    await runBuildEnd(plugin, root, '/docs/')

    expect(loadEnv).toHaveBeenCalledWith('test', root, '')
    expect(ensureItemMetadata).toHaveBeenCalledOnce()
    expect(await uploadedItems()).toEqual([
      { content: '# About', key: 'about.md', url: '/docs/about.html' },
      { content: '# Guide', key: 'guide/index.md', url: '/docs/guide/' },
      { content: '# Intro', key: 'guide/intro.md', url: '/docs/guide/intro.html' },
      { content: '# Home', key: 'index.md', url: '/docs/' },
    ])
  })

  it('supports absolute folders and clean URLs', async () => {
    const root = await createTemporaryDirectory()
    const content = await createTemporaryDirectory()
    await writeFile(join(content, 'guide.md'), '# Guide')

    const plugin = cloudflareAISearchSync({
      base: '/search/',
      cleanUrls: true,
      folder: content,
    })
    await runBuildEnd(plugin, root, '/docs/')

    expect(await uploadedItems()).toEqual([
      { content: '# Guide', key: 'guide.md', url: '/search/guide' },
    ])
  })

  it('reports missing folders before making Cloudflare calls', async () => {
    const root = await createTemporaryDirectory()
    const plugin = cloudflareAISearchSync({ folder: 'missing' })

    await expect(runBuildEnd(plugin, root)).rejects.toThrow('ENOENT')

    expect(ensureItemMetadata).not.toHaveBeenCalled()
    expect(client.list).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
  })
})

async function runBuildEnd(plugin: ReturnType<typeof cloudflareAISearchSync>, root: string, base = '/') {
  const hooks = testPlugin(plugin)
  hooks.configResolved({
    base,
    envDir: root,
    logger: { info },
    mode: 'test',
    root,
  } as never)
  await hooks.buildEnd()
}

interface TestPlugin {
  apply: 'build'
  buildEnd: (error?: Error) => void | Promise<void>
  configResolved: (config: unknown) => void | Promise<void>
}

function testPlugin(plugin: ReturnType<typeof cloudflareAISearchSync>): TestPlugin {
  return plugin as unknown as TestPlugin
}

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'cloudflare-ai-search-sync-'))
  temporaryDirectories.push(directory)
  return directory
}

async function uploadedItems(): Promise<Array<{ content: string, key: string, url: string }>> {
  return Promise.all(client.upload.mock.calls.map(async ([, parameters]) => ({
    content: await parameters.file.file.text(),
    key: parameters.file.file.name,
    url: JSON.parse(parameters.file.metadata).url,
  })))
}
