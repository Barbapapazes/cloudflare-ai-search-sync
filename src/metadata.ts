import Cloudflare from 'cloudflare'

export interface CloudflareAISearchCredentials {
  accountId: string
  apiToken: string
  instanceId: string
  namespace: string
}

const iconMetadata = {
  data_type: 'text',
  field_name: 'icon',
} as const

interface CustomMetadata {
  data_type: 'text' | 'number' | 'boolean' | 'datetime'
  field_name: string
}

export async function ensureIconMetadata(
  credentials: CloudflareAISearchCredentials,
): Promise<void> {
  const client = new Cloudflare({ apiToken: credentials.apiToken })

  try {
    const instance = await client.aiSearch.namespaces.instances.read(credentials.instanceId, {
      account_id: credentials.accountId,
      name: credentials.namespace,
    })
    const customMetadata = instance.custom_metadata ?? []
    const iconFields = customMetadata.filter(field => field.field_name === iconMetadata.field_name)

    if (iconFields.length === 0) {
      await client.aiSearch.namespaces.instances.update(credentials.instanceId, {
        account_id: credentials.accountId,
        custom_metadata: [...customMetadata, iconMetadata],
        name: credentials.namespace,
      })
      return
    }

    if (iconFields.length !== 1 || iconFields[0].data_type !== iconMetadata.data_type) {
      throw new Error(
        `Expected exactly one custom metadata field named "${iconMetadata.field_name}" with type "${iconMetadata.data_type}", received ${formatIconFields(iconFields)}.`,
      )
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

function formatIconFields(fields: CustomMetadata[]): string {
  return fields.length === 0 ? 'no icon fields' : JSON.stringify(fields)
}
