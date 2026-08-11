# vite-plugin-cloudflare-ai-search-sync

A Vite plugin that synchronizes Markdown files to Cloudflare AI Search and configures the metadata schema required to use result icons with the [AI Search snippet](https://github.com/cloudflare/ai-search-snippet).

## Installation

```sh
pnpm add vite-plugin-cloudflare-ai-search-sync
```

## Configuration

The plugin runs only for `vite build --mode production`. It does not contact Cloudflare while developing or for builds with another mode.

Configure credentials in a local `.env` file or through your CI environment:

```sh
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_SEARCH_INSTANCE_ID=
CLOUDFLARE_AI_SEARCH_NAMESPACE=
```

Alternatively, pass them directly as plugin options. Explicit options take precedence over environment variables.

```ts
import { defineConfig } from 'vite'
import { cloudflareAISearchSync } from 'vite-plugin-cloudflare-ai-search-sync'
import { vitepressSource } from 'vite-plugin-cloudflare-ai-search-sync/vitepress'

export default defineConfig({
  plugins: [cloudflareAISearchSync({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    instanceId: process.env.CLOUDFLARE_AI_SEARCH_INSTANCE_ID,
    namespace: process.env.CLOUDFLARE_AI_SEARCH_NAMESPACE,
    source: vitepressSource(),
  })],
})
```

For VitePress, use the native `buildEnd` hook. It resolves the public routes, including `base`, rewrites, and `cleanUrls`, before uploading them:

```ts
import { cloudflareAISearchSync } from 'vite-plugin-cloudflare-ai-search-sync/vitepress'
import { defineConfig } from 'vitepress'

export default defineConfig({
  buildEnd: cloudflareAISearchSync(),
})
```

All four Cloudflare settings are required. The API token needs **Account / AI Search:Edit** and **Account / AI Search:Run** permissions. Keep it server-side; never expose it through Vite client configuration or a browser bundle.

The plugin always targets a named AI Search namespace. It never queries or updates an instance in the default namespace.

## Metadata behavior

Cloudflare AI Search calls this setting `custom_metadata`. It defines the schema for item metadata, rather than the instance-level `metadata` object.

The AI Search snippet uses `item.metadata.icon` for result icons, so each production build ensures that the instance has this field:

```json
{ "field_name": "icon", "data_type": "text" }
```

- If `icon` is absent, the plugin adds it and preserves any unrelated custom metadata fields.
- If exactly one `icon` field exists with type `text`, the plugin makes no change.
- If `icon` is duplicated or uses another type, the plugin fails the build without changing the instance.

## Source behavior

`source` is optional, so existing `cloudflareAISearchSync()` usage remains valid. When supplied, it is authoritative over every item in the AI Search `builtin` source: the plugin uploads every item and deletes every built-in item that is absent from the completed local snapshot. This includes manually uploaded built-in items.

The plugin uploads all source files on each production build. Cloudflare AI Search detects unchanged content for the same key and skips reindexing it. Uploads complete before stale items are deleted, so an upload failure cannot remove existing content.

Generic sources use their root-relative POSIX `relativePath` as the item key. `vitepressSource()` finds raw `*.md` files below Vite's resolved project root, skips `.git`, `.vitepress`, `dist`, and `node_modules`, and produces those paths. The VitePress `buildEnd` helper should be preferred for VitePress sites because its keys are their resolved public URLs. After each upload, it explicitly updates the AI Search item key to that URL, which the AI Search snippet uses for result links. It excludes the site-root URL (`/`, or the configured `base`) from synchronization.

Item keys must be non-empty and at most 128 characters. UTF-8 source content must be at most 4 MB. The build fails before contacting AI Search if the local snapshot has duplicate keys or exceeds either limit.

## Development

The repository uses Node 24 and pnpm 11.21.0. The VitePress fixture is located in `.playgrounds/vitepress`.

## Repository

<https://github.com/Barbapapazes/vite-plugin-cloudflare-ai-search-sync>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Estéban Soubiran](https://github.com/Barbapapazes)
