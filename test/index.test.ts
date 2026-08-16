import { describe, expect, it } from 'vitest'
import * as api from '../src/index.js'

describe('public API', () => {
  it('exports the composable synchronization utilities', () => {
    expect(api).toMatchObject({
      assertCredential: expect.any(Function),
      ensureItemMetadata: expect.any(Function),
      getCloudflareClient: expect.any(Function),
      isSyncEnabled: expect.any(Function),
      resolveCredentials: expect.any(Function),
      siteRoot: expect.any(Function),
      syncItems: expect.any(Function),
      synchronizeItems: expect.any(Function),
      toPublicUrl: expect.any(Function),
    })
    expect(api).not.toHaveProperty('cloudflareAISearchSync')
  })
})
