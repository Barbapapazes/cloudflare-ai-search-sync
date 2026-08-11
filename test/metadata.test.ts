import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureItemMetadata } from '../src/metadata.js'

const { read, update } = vi.hoisted(() => ({
  read: vi.fn(),
  update: vi.fn(),
}))

vi.mock('cloudflare', () => ({
  default: class {
    aiSearch = { namespaces: { instances: { read, update } } }
  },
}))

const credentials = {
  accountId: 'account',
  apiToken: 'token',
  instanceId: 'instance',
  namespace: 'namespace',
}

describe('ensureItemMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds missing icon and URL fields while preserving existing metadata', async () => {
    read.mockResolvedValue({
      custom_metadata: [{ data_type: 'boolean', field_name: 'published' }],
    })

    await ensureItemMetadata(credentials)

    expect(update).toHaveBeenCalledWith('instance', {
      account_id: 'account',
      custom_metadata: [
        { data_type: 'boolean', field_name: 'published' },
        { data_type: 'text', field_name: 'icon' },
        { data_type: 'text', field_name: 'url' },
      ],
      name: 'namespace',
    })
  })

  it('does not update an instance with valid required metadata', async () => {
    read.mockResolvedValue({
      custom_metadata: [
        { data_type: 'text', field_name: 'icon' },
        { data_type: 'text', field_name: 'url' },
      ],
    })

    await ensureItemMetadata(credentials)

    expect(update).not.toHaveBeenCalled()
  })

  it('rejects invalid required metadata without updating the instance', async () => {
    read.mockResolvedValue({
      custom_metadata: [
        { data_type: 'text', field_name: 'icon' },
        { data_type: 'number', field_name: 'url' },
      ],
    })

    await expect(ensureItemMetadata(credentials)).rejects.toThrow('Expected exactly one custom metadata field named "url" with type "text"')

    expect(update).not.toHaveBeenCalled()
  })
})
