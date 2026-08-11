import { describe, expect, it, vi } from 'vitest'
import { getCloudflareClient } from '../src/client.js'

const { Cloudflare, construct, instance } = vi.hoisted(() => {
  const construct = vi.fn()
  const instance = {}

  return {
    Cloudflare: class {
      constructor(options: unknown) {
        construct(options)
        return instance
      }
    },
    construct,
    instance,
  }
})

vi.mock('cloudflare', () => ({ default: Cloudflare }))

describe('getCloudflareClient', () => {
  it('creates and caches a single client', () => {
    const firstClient = getCloudflareClient('first-token')
    const secondClient = getCloudflareClient('second-token')

    expect(firstClient).toBe(instance)
    expect(secondClient).toBe(instance)
    expect(construct).toHaveBeenCalledOnce()
    expect(construct).toHaveBeenCalledWith({ apiToken: 'first-token' })
  })
})
