import { getCloudflareClient } from './client.js'
import { requiredMetadata } from './constants.js'

export interface CloudflareAISearchCredentials {
  accountId: string
  apiToken: string
  instanceId: string
  namespace: string
}

interface CustomMetadata {
  data_type: 'text' | 'number' | 'boolean' | 'datetime'
  field_name: string
}

export async function ensureItemMetadata(
  credentials: CloudflareAISearchCredentials,
): Promise<void> {
  const client = getCloudflareClient(credentials.apiToken)

  try {
    const instance = await client.aiSearch.namespaces.instances.read(credentials.instanceId, {
      account_id: credentials.accountId,
      name: credentials.namespace,
    })
    const customMetadata = instance.custom_metadata ?? []
    const missingMetadata = []

    for (const metadata of requiredMetadata) {
      const fields = customMetadata.filter(field => field.field_name === metadata.field_name)

      if (fields.length === 0) {
        missingMetadata.push(metadata)
      }
      else if (fields.length !== 1 || fields[0].data_type !== metadata.data_type) {
        throw new Error(
          `Expected exactly one custom metadata field named "${metadata.field_name}" with type "${metadata.data_type}", received ${formatMetadataFields(metadata.field_name, fields)}.`,
        )
      }
    }

    if (missingMetadata.length > 0) {
      await client.aiSearch.namespaces.instances.update(credentials.instanceId, {
        account_id: credentials.accountId,
        custom_metadata: [...customMetadata, ...missingMetadata],
        name: credentials.namespace,
      })
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Unable to verify AI Search metadata for instance "${credentials.instanceId}" in account "${credentials.accountId}": ${message}`,
      { cause: error },
    )
  }
}

function formatMetadataFields(fieldName: string, fields: CustomMetadata[]): string {
  return fields.length === 0 ? `no ${fieldName} fields` : JSON.stringify(fields)
}
