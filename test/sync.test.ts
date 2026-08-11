import { describe, expect, it, vi } from 'vitest'
import { syncItems } from '../src/sync.js'

const { getCloudflareClient } = vi.hoisted(() => ({
  getCloudflareClient: vi.fn(),
}))

vi.mock('../src/client.js', () => ({ getCloudflareClient }))

const credentials = {
  accountId: 'account',
  apiToken: 'token',
  instanceId: 'instance',
  namespace: 'namespace',
}

describe('syncItems', () => {
  it('uploads the complete snapshot then deletes stale built-in items', async () => {
    const createOrUpdate = vi.fn()
    const upload = vi.fn()
    const remove = vi.fn()
    const list = vi.fn(() => paginatedItems([
      { id: 'current-id', key: 'current.md' },
      { id: 'stale-id', key: 'stale.md' },
    ]))
    const client = { createOrUpdate, delete: remove, list, upload }
    const info = vi.fn()
    useClient(client)

    await syncItems(credentials, [{ content: '# Current', key: 'current.md', url: '/current.html' }], { info })

    expect(list).toHaveBeenCalledWith('instance', {
      account_id: 'account',
      name: 'namespace',
      source: 'builtin',
    })
    expect(upload).toHaveBeenCalledOnce()
    const [, parameters] = upload.mock.calls[0]
    expect(parameters.file.metadata).toBe('{"url":"/current.html"}')
    expect(parameters.file.wait_for_completion).toBe(false)
    expect(parameters.file.file.name).toBe('current.md')
    expect(await parameters.file.file.text()).toBe('# Current')
    expect(createOrUpdate).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('stale-id', {
      account_id: 'account',
      id: 'instance',
      name: 'namespace',
    })
    expect(info).toHaveBeenCalledWith('[vite-plugin-cloudflare-ai-search-sync] Uploading AI Search item "current.md".')
    expect(info).toHaveBeenCalledWith('[vite-plugin-cloudflare-ai-search-sync] Deleting AI Search item "stale.md" (stale-id).')
  })

  it('does not delete remote items when an upload fails', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('upload failed'))
    const remove = vi.fn()
    const client = {
      createOrUpdate: vi.fn(),
      delete: remove,
      list: () => paginatedItems([{ id: 'stale-id', key: 'stale.md' }]),
      upload,
    }
    useClient(client)

    await expect(
      syncItems(credentials, [{ content: '# Current', key: 'current.md', url: '/current.html' }]),
    )
      .rejects
      .toThrow('upload failed')

    expect(remove).not.toHaveBeenCalled()
  })

  it('preserves path-based storage keys when deleting stale items', async () => {
    const createOrUpdate = vi.fn()
    const upload = vi.fn()
    const remove = vi.fn()
    const client = {
      createOrUpdate,
      delete: remove,
      list: () => paginatedItems([{ id: 'item-id', key: 'guides/markdown-examples.md' }]),
      upload,
    }
    useClient(client)

    await syncItems(credentials, [{
      content: '# Markdown examples',
      key: 'guides/markdown-examples.md',
      url: '/guides/markdown-examples.html',
    }])

    expect(upload).toHaveBeenCalledOnce()
    expect(upload.mock.calls[0][1].file.file.name).toBe('guides/markdown-examples.md')
    expect(upload.mock.calls[0][1].file.metadata).toBe('{"url":"/guides/markdown-examples.html"}')
    expect(createOrUpdate).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('rejects invalid snapshots before making API calls', async () => {
    const client = {
      createOrUpdate: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      upload: vi.fn(),
    }
    useClient(client)

    await expect(syncItems(credentials, [
      { content: 'one', key: 'duplicate.md', url: '/duplicate.html' },
      { content: 'two', key: 'duplicate.md', url: '/other.html' },
    ])).rejects.toThrow('occurs more than once')

    expect(client.list).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
    expect(client.delete).not.toHaveBeenCalled()
  })

  it('deletes all built-in items for an empty snapshot', async () => {
    const remove = vi.fn()
    const client = {
      createOrUpdate: vi.fn(),
      delete: remove,
      list: () => paginatedItems([
        { id: 'first-id', key: 'first.md' },
        { id: 'second-id', key: 'second.md' },
      ]),
      upload: vi.fn(),
    }
    useClient(client)

    await syncItems(credentials, [])

    expect(remove).toHaveBeenCalledTimes(2)
    expect(client.upload).not.toHaveBeenCalled()
  })

  it('rejects URLs that do not start with a slash before making API calls', async () => {
    const client = {
      createOrUpdate: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      upload: vi.fn(),
    }
    useClient(client)

    await expect(syncItems(credentials, [{
      content: '# Current',
      key: 'current.md',
      url: 'current.html',
    }])).rejects.toThrow('must start with "/"')

    expect(client.list).not.toHaveBeenCalled()
    expect(client.upload).not.toHaveBeenCalled()
  })
})

function useClient(client: unknown): void {
  getCloudflareClient.mockReturnValue({
    aiSearch: { namespaces: { instances: { items: client } } },
  })
}

function paginatedItems(items: Array<{ id: string, key: string }>) {
  return {
    async* [Symbol.asyncIterator]() {
      yield* items
    },
  }
}
