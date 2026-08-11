import type Cloudflare from 'cloudflare'
import type { CloudflareAISearchCredentials } from './metadata.js'
import { Buffer } from 'node:buffer'

const maxFileSize = 4 * 1024 * 1024
const maxKeyLength = 128

export interface SyncItem {
  content: string
  key: string
  metadata?: Record<string, unknown>
}

export interface SyncLogger {
  info: (message: string) => void
}

type ItemsClient = Cloudflare['aiSearch']['namespaces']['instances']['items']

export async function syncItems(
  credentials: CloudflareAISearchCredentials,
  items: Iterable<SyncItem>,
  client: ItemsClient,
  logger?: SyncLogger,
): Promise<void> {
  const snapshot = validateSnapshot(items)
  const remoteItems = await listBuiltinItems(credentials, client)

  for (const item of snapshot) {
    try {
      logger?.info(`[vite-plugin-cloudflare-ai-search-sync] Uploading AI Search item "${item.key}".`)
      await client.upload(credentials.instanceId, {
        account_id: credentials.accountId,
        file: {
          file: new File([item.content], item.key, { type: 'text/markdown' }),
          metadata: JSON.stringify(item.metadata ?? {}),
          wait_for_completion: false,
        },
        name: credentials.namespace,
      })
      logger?.info(`[vite-plugin-cloudflare-ai-search-sync] Setting AI Search item URL to "${item.key}".`)
      await client.createOrUpdate(credentials.instanceId, {
        account_id: credentials.accountId,
        key: item.key,
        name: credentials.namespace,
        next_action: 'INDEX',
        wait_for_completion: false,
      })
    }
    catch (error) {
      throw syncError('upload or update', credentials, item.key, error)
    }
  }

  const localKeys = new Set(snapshot.map(item => toStorageKey(item.key)))
  for (const remoteItem of remoteItems) {
    if (localKeys.has(toStorageKey(remoteItem.key)))
      continue

    try {
      logger?.info(`[vite-plugin-cloudflare-ai-search-sync] Deleting AI Search item "${remoteItem.key}" (${remoteItem.id}).`)
      await client.delete(remoteItem.id, {
        account_id: credentials.accountId,
        id: credentials.instanceId,
        name: credentials.namespace,
      })
    }
    catch (error) {
      throw syncError('delete', credentials, `${remoteItem.key} (${remoteItem.id})`, error)
    }
  }
}

function toStorageKey(key: string): string {
  return key.replace(/^\/+/, '')
}

function validateSnapshot(items: Iterable<SyncItem>): SyncItem[] {
  const snapshot = [...items]
  const keys = new Set<string>()

  for (const item of snapshot) {
    if (!item.key) {
      throw new Error('AI Search item keys must not be empty.')
    }
    if (item.key.length > maxKeyLength) {
      throw new Error(`AI Search item key "${item.key}" exceeds the ${maxKeyLength}-character limit.`)
    }
    if (keys.has(item.key)) {
      throw new Error(`AI Search item key "${item.key}" occurs more than once.`)
    }
    if (Buffer.byteLength(item.content, 'utf8') > maxFileSize) {
      throw new Error(`AI Search item "${item.key}" exceeds the 4 MB upload limit.`)
    }
    keys.add(item.key)
  }

  return snapshot
}

async function listBuiltinItems(
  credentials: CloudflareAISearchCredentials,
  client: ItemsClient,
) {
  try {
    const items = []
    for await (const item of client.list(credentials.instanceId, {
      account_id: credentials.accountId,
      name: credentials.namespace,
      source: 'builtin',
    })) {
      items.push(item)
    }
    return items
  }
  catch (error) {
    throw syncError('list', credentials, 'builtin items', error)
  }
}

function syncError(
  operation: 'delete' | 'list' | 'upload or update',
  credentials: CloudflareAISearchCredentials,
  item: string,
  error: unknown,
): Error {
  const message = error instanceof Error ? error.message : String(error)
  return new Error(
    `Unable to ${operation} AI Search item "${item}" for instance "${credentials.instanceId}" in namespace "${credentials.namespace}" and account "${credentials.accountId}": ${message}`,
    { cause: error },
  )
}
