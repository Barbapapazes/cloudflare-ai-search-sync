import type { NuxtContentAfterParseContext, NuxtContentSyncNuxt } from '../src/nuxt/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerNuxtContentSync } from '../src/nuxt/index.js'
import { toNuxtContentItem } from '../src/nuxt/utils.js'

const { ensureItemMetadata, syncItems } = vi.hoisted(() => ({
  ensureItemMetadata: vi.fn(),
  syncItems: vi.fn(),
}))

vi.mock('../src/metadata.js', () => ({ ensureItemMetadata }))
vi.mock('../src/sync.js', () => ({ syncItems }))

const credentials = {
  accountId: 'account',
  apiToken: 'token',
  instanceId: 'instance',
  namespace: 'namespace',
}

describe('nuxt Content snapshot items', () => {
  it('uses raw Markdown, project-relative keys, and resolved routes', () => {
    expect(toNuxtContentItem(page({
      content: { extension: '.md', path: '/guide/intro' },
      file: { body: '# Intro', path: '/project/content/guide/intro.md' },
    }), '/project', '/docs/')).toEqual({
      content: '# Intro',
      description: 'Intro',
      key: 'content/guide/intro.md',
      title: 'Intro',
      url: '/docs/guide/intro',
    })
  })

  it('includes the root page and excludes drafts and non-page Markdown', () => {
    expect(toNuxtContentItem(page({
      content: { extension: '.md', path: '/' },
      file: { body: '# Home', path: '/project/content/index.md' },
    }), '/project', '/docs/')).toMatchObject({ url: '/docs/' })
    expect(toNuxtContentItem(page({ content: { draft: true, extension: '.md', path: '/draft' } }), '/project', '/')).toBeUndefined()
    expect(toNuxtContentItem(page({ collection: { type: 'data' } }), '/project', '/')).toBeUndefined()
    expect(toNuxtContentItem(page({
      content: { extension: '.yml', path: '/data' },
      file: { body: 'title: Data', path: '/project/content/data.yml' },
    }), '/project', '/')).toBeUndefined()
  })
})

describe('registerNuxtContentSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', credentials.accountId)
    vi.stubEnv('CLOUDFLARE_API_TOKEN', credentials.apiToken)
    vi.stubEnv('CLOUDFLARE_AI_SEARCH_INSTANCE_ID', credentials.instanceId)
    vi.stubEnv('CLOUDFLARE_AI_SEARCH_NAMESPACE', credentials.namespace)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not register hooks during development', () => {
    const { nuxt, hook } = createNuxt(true)

    registerNuxtContentSync({ enabled: true }, nuxt)

    expect(hook).not.toHaveBeenCalled()
  })

  it('does not register hooks by default', () => {
    const { nuxt, hook } = createNuxt(false)

    registerNuxtContentSync({}, nuxt)

    expect(hook).not.toHaveBeenCalled()
  })

  it('enables synchronization from the environment', () => {
    vi.stubEnv('CLOUDFLARE_AI_SEARCH_SYNC_ENABLED', 'true')
    const { nuxt, hook } = createNuxt(false)

    registerNuxtContentSync({}, nuxt)

    expect(hook).toHaveBeenCalledTimes(2)
  })

  it('synchronizes the completed production snapshot at modules:done', async () => {
    const { hooks, nuxt } = createNuxt(false)
    registerNuxtContentSync({ enabled: true }, nuxt)

    await hooks.get('content:file:afterParse')?.(page({
      content: { extension: '.md', path: '/guide' },
      file: { body: '# Guide', path: '/project/content/guide.md' },
    }))
    await hooks.get('content:file:afterParse')?.(page({
      content: { draft: true, extension: '.md', path: '/draft' },
      file: { body: '# Draft', path: '/project/content/draft.md' },
    }))

    expect(ensureItemMetadata).not.toHaveBeenCalled()
    expect(syncItems).not.toHaveBeenCalled()

    await hooks.get('modules:done')?.()

    expect(ensureItemMetadata).toHaveBeenCalledWith(credentials)
    expect(syncItems).toHaveBeenCalledWith(credentials, [{
      content: '# Guide',
      description: 'Guide',
      key: 'content/guide.md',
      title: 'Guide',
      url: '/docs/guide',
    }], nuxt.logger)
  })
})

function createNuxt(dev: boolean) {
  const hooks = new Map<string, (context?: NuxtContentAfterParseContext) => void | Promise<void>>()
  const hook = vi.fn((name: string, handler: (context?: NuxtContentAfterParseContext) => void | Promise<void>) => {
    hooks.set(name, handler)
  })
  const nuxt: NuxtContentSyncNuxt = {
    hook,
    logger: { info: vi.fn() },
    options: { app: { baseURL: '/docs/' }, dev, rootDir: '/project' },
  }

  return { hook, hooks, nuxt }
}

function page(context: Partial<NuxtContentAfterParseContext> = {}): NuxtContentAfterParseContext {
  return {
    collection: { type: 'page' },
    content: { extension: '.md', path: '/page' },
    file: { body: '# Page', path: '/project/content/page.md' },
    ...context,
  }
}
