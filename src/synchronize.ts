import type { CloudflareAISearchCredentials } from './metadata.js'
import type { SyncItem, SyncLogger } from './sync.js'
import { ensureItemMetadata } from './metadata.js'
import { syncItems } from './sync.js'

export async function synchronizeItems(
  credentials: CloudflareAISearchCredentials,
  items: Iterable<SyncItem>,
  logger?: SyncLogger,
): Promise<void> {
  await ensureItemMetadata(credentials)
  await syncItems(credentials, items, logger)
}
