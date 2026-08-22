# cloudflare-ai-search-sync

A Vite plugin that synchronizes Markdown files to Cloudflare AI Search and configures the metadata schema required to use result links and icons with the [AI Search snippet](https://github.com/cloudflare/ai-search-snippet). A VitePress `buildEnd` hook is also available.

## Installation

```sh
pnpm add cloudflare-ai-search-sync
```

## Configuration

The adapters are disabled by default. Enable synchronization with `enabled: true` or `CLOUDFLARE_AI_SEARCH_SYNC_ENABLED=true`. An explicit `enabled` option takes precedence over the environment variable. Once enabled, the Vite plugin runs at the end of successful builds only. It does not contact Cloudflare while developing or after a failed build.

Configure credentials in a local `.env` file or through your CI environment:

```sh
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_SEARCH_INSTANCE_ID=
CLOUDFLARE_AI_SEARCH_NAMESPACE=
CLOUDFLARE_AI_SEARCH_SYNC_ENABLED=true
```

Vite loads these variables using its resolved mode and environment directory. Alternatively, pass them directly as plugin options. Explicit options take precedence over environment variables.

### Custom integrations

Build an adapter for any content source with the root package utilities. Provide the credentials, map your content to `SyncItem` objects, then synchronize the completed snapshot:

```ts
import type { CloudflareAISearchCredentials, SyncItem } from 'cloudflare-ai-search-sync'
import {
  synchronizeItems,
  toPublicUrl,
} from 'cloudflare-ai-search-sync'

const credentials: CloudflareAISearchCredentials = {
  accountId,
  apiToken,
  instanceId,
  namespace,
}
const items: SyncItem[] = pages.map(page => ({
  content: page.markdown,
  description: page.description,
  icon: 'page',
  key: page.path,
  title: page.title,
  url: toPublicUrl(page.path, '/docs/'),
}))

await synchronizeItems(credentials, items)
```

`synchronizeItems` configures the required metadata before uploading the snapshot and deleting stale built-in items. Use `ensureItemMetadata` or `syncItems` separately when your integration needs to control either phase. `isSyncEnabled`, `siteRoot`, and `getCloudflareClient` are also available for custom integration code.

### Vite filesystem adapter

Use the `/fs` entry point to synchronize a folder of Markdown files after successful Vite builds. Relative folders are resolved from the Vite project root.

```ts
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/fs'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflareAISearchSync({ enabled: true, folder: './docs' }),
  ],
})
```

The adapter scans regular `.md` files recursively, retains their paths as AI Search keys, and derives VitePress-compatible URLs from Vite's resolved `base`. Set `cleanUrls: true` to omit `.html` from non-index routes, or set `base` to override Vite's resolved base.

### VitePress adapter

Use the native VitePress `buildEnd` hook. It resolves public routes, including `base`, rewrites, and `cleanUrls`, before uploading them:

```ts
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/vitepress'
import { defineConfig } from 'vitepress'

export default defineConfig({
  buildEnd: cloudflareAISearchSync({ enabled: true }),
})
```

### Nuxt Content adapter

Nuxt 4 and Nuxt Content v3 applications can register the dedicated module. It synchronizes only during `nuxt build` and `nuxt generate`; `nuxt dev` does not read credentials or contact Cloudflare.

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'cloudflare-ai-search-sync/nuxt',
  ],
  cloudflareAISearchSync: { enabled: true },
})
```

The module indexes published Markdown documents from Nuxt Content `page` collections only. It uploads the parser-input Markdown, uses the source path relative to the Nuxt project root as the key, and uses Nuxt Content's resolved route—prefixed with `app.baseURL`—as the item URL. Root `index.md` is included. Documents with `draft: true` are excluded, as are data collections and non-Markdown sources.

Use the same four `CLOUDFLARE_*` variables above or pass credentials in `cloudflareAISearchSync`. Keep all credentials in build-only environment variables; never put them in Nuxt public runtime configuration.

All four Cloudflare settings are required. The API token needs **Account / AI Search:Edit** and **Account / AI Search:Run** permissions. Keep it server-side; never expose it through Vite client configuration or a browser bundle.

The plugin always targets a named AI Search namespace. It never queries or updates an instance in the default namespace.

## Metadata behavior

Cloudflare AI Search calls this setting `custom_metadata`. It defines the schema for item metadata, rather than the instance-level `metadata` object.

The AI Search snippet displays `item.metadata.title` and `item.metadata.description`, and also uses `item.metadata.icon` for result icons and `item.metadata.url` for result links. Each production build ensures that the instance has these fields:

```json
[
  { "field_name": "description", "data_type": "text" },
  { "field_name": "icon", "data_type": "text" },
  { "field_name": "title", "data_type": "text" },
  { "field_name": "url", "data_type": "text" }
]
```

- If a required field is absent, the plugin adds it and preserves any unrelated custom metadata fields.
- If exactly one field of each required name exists with type `text`, the plugin makes no change.
- If a required field is duplicated or uses another type, the plugin fails the build without changing the instance.

## Synchronization behavior

The adapters are authoritative over the AI Search `builtin` source: they upload every item in the completed Markdown snapshot and delete every built-in item absent from it. This includes manually uploaded built-in items. An empty Markdown folder is therefore authoritative and deletes all built-in items.

Each production build uploads pages under their Markdown filename and path—such as `guide/page.md`—to prevent filename collisions. It writes the resolved, slash-prefixed URL to `item.metadata.url`, plus a non-empty title and description. The filesystem and VitePress adapters prefer Markdown frontmatter (`title` and `description`), then use the first heading and paragraph for missing text. Nuxt Content prefers its parsed metadata and otherwise follows the same Markdown rules. The VitePress adapter excludes the site-root URL (`/`, or the configured `base`); the filesystem and Nuxt Content adapters include their root `index.md`.

The `icon` metadata identifies the uploaded content shape. The built-in adapters upload complete documents and set it to `page`. Custom integrations that split a document into section items must set it to `section`. These values expose the `result-icon-page` and `result-icon-section` Shadow Parts in the AI Search snippet.

Cloudflare AI Search detects unchanged content for the same key and skips reindexing it. Uploads complete before stale items are deleted, so an upload failure cannot remove existing content.

Item keys must be non-empty and at most 128 characters. Item URLs must start with `/`. UTF-8 source content must be at most 4 MB. The build fails before contacting AI Search if the local snapshot has duplicate keys or exceeds either limit.

## Development

The repository uses Node 24 and pnpm 11.21.0. Manual fixtures are located in `.playgrounds/vitepress`, `.playgrounds/vite-vue-markdown`, and `.playgrounds/nuxt-content`.

The Vite Vue Markdown fixture renders its `src/pages` Markdown files through `unplugin-vue-markdown` and synchronizes that same folder with the filesystem adapter. Run `pnpm dev` from its directory to try the pages. Its `build` command, as well as the Nuxt fixture's `build` and `generate` commands, requires credentials for an isolated AI Search namespace.

## Repository

<https://github.com/Barbapapazes/cloudflare-ai-search-sync>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Estéban Soubiran](https://github.com/Barbapapazes)
