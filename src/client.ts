import Cloudflare from 'cloudflare'

let client: Cloudflare | undefined

export function getCloudflareClient(apiToken: string): Cloudflare {
  client ??= new Cloudflare({ apiToken })
  return client
}
