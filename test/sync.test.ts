import { describe, expect, it, vi } from 'vitest'
import { syncItems } from '../src/sync.js'

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

    await syncItems(credentials, [{ content: '# Current', key: 'current.md' }], client as never, { info })

    expect(list).toHaveBeenCalledWith('instance', {
      account_id: 'account',
      name: 'namespace',
      source: 'builtin',
    })
    expect(upload).toHaveBeenCalledOnce()
    const [, parameters] = upload.mock.calls[0]
    expect(parameters.file.metadata).toBe('{}')
    expect(parameters.file.wait_for_completion).toBe(false)
    expect(parameters.file.file.name).toBe('current.md')
    expect(await parameters.file.file.text()).toBe('# Current')
    expect(createOrUpdate).toHaveBeenCalledWith('instance', {
      account_id: 'account',
      key: 'current.md',
      name: 'namespace',
      next_action: 'INDEX',
      wait_for_completion: false,
    })
    expect(remove).toHaveBeenCalledWith('stale-id', {
      account_id: 'account',
      id: 'instance',
      name: 'namespace',
    })
    expect(info).toHaveBeenCalledWith('[vite-plugin-cloudflare-ai-search-sync] Uploading AI Search item "current.md".')
    expect(info).toHaveBeenCalledWith('[vite-plugin-cloudflare-ai-search-sync] Setting AI Search item URL to "current.md".')
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

    await expect(
      syncItems(credentials, [{ content: '# Current', key: 'current.md' }], client as never),
    )
      .rejects
      .toThrow('upload failed')

    expect(remove).not.toHaveBeenCalled()
  })

  it('reuploads a VitePress key when AI Search omits its leading slash', async () => {
    const createOrUpdate = vi.fn()
    const upload = vi.fn()
    const remove = vi.fn()
    const client = {
      createOrUpdate,
      delete: remove,
      list: () => paginatedItems([{ id: 'item-id', key: 'markdown-examples.html' }]),
      upload,
    }

    await syncItems(credentials, [{ content: '# Markdown examples', key: '/markdown-examples.html' }], client as never)

    expect(upload).toHaveBeenCalledOnce()
    expect(createOrUpdate).toHaveBeenCalledWith('instance', {
      account_id: 'account',
      key: '/markdown-examples.html',
      name: 'namespace',
      next_action: 'INDEX',
      wait_for_completion: false,
    })
    expect(remove).not.toHaveBeenCalled()
  })

  it('rejects invalid snapshots before making API calls', async () => {
    const client = {
      createOrUpdate: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      upload: vi.fn(),
    }

    await expect(syncItems(credentials, [
      { content: 'one', key: 'duplicate.md' },
      { content: 'two', key: 'duplicate.md' },
    ], client as never)).rejects.toThrow('occurs more than once')

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

    await syncItems(credentials, [], client as never)

    expect(remove).toHaveBeenCalledTimes(2)
    expect(client.upload).not.toHaveBeenCalled()
  })
})

function paginatedItems(items: Array<{ id: string, key: string }>) {
  return {
    async* [Symbol.asyncIterator]() {
      yield* items
    },
  }
}
