# cloudflare-ai-search-sync

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![pkg.pr.new](https://pkg.pr.new/badge/Barbapapazes/cloudflare-ai-search-sync)](https://pkg.pr.new/~/Barbapapazes/cloudflare-ai-search-sync)

Synchronize Markdown and Nuxt Content with [Cloudflare AI Search](https://developers.cloudflare.com/ai-search/). Read [Bringing Cloudflare AI Search to Docus and VitePress](https://soubiran.dev/posts/bringing-cloudflare-ai-search-to-docus-and-vitepress) for the story behind the package family.

- Index Markdown from Vite, VitePress 2, or Nuxt Content.
- Resolve public URLs from each framework's routing configuration.
- Keep Cloudflare's built-in source in sync with the completed local snapshot.
- Configure the metadata used by the Cloudflare AI Search snippet.

## Installation

```bash
pnpm add cloudflare-ai-search-sync
```

## Usage

The adapters are disabled by default. Enable synchronization with `enabled: true` or `CLOUDFLARE_AI_SEARCH_SYNC_ENABLED=true`. An explicit option takes precedence over the environment variable.

### VitePress

Use the native VitePress 2 `buildEnd` hook:

```ts
// .vitepress/config.ts
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/vitepress'
import { defineConfig } from 'vitepress'

export default defineConfig({
  buildEnd: cloudflareAISearchSync({ enabled: true }),
})
```

The adapter resolves `base`, rewrites, and `cleanUrls` before uploading each page.

### Nuxt Content

Register the Nuxt module after Nuxt Content:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'cloudflare-ai-search-sync/nuxt',
  ],
  cloudflareAISearchSync: { enabled: true },
})
```

The module runs during `nuxt build` and `nuxt generate`, never during `nuxt dev`. It indexes published Markdown documents from Nuxt Content `page` collections and excludes documents with `draft: true`, including drafts stored in `meta`.

### Vite filesystem

Synchronize a folder of Markdown files after successful Vite builds:

```ts
// vite.config.ts
import { cloudflareAISearchSync } from 'cloudflare-ai-search-sync/fs'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflareAISearchSync({
      enabled: true,
      folder: './docs',
    }),
  ],
})
```

Relative folders resolve from the Vite project root. Set `cleanUrls: true` to omit `.html` from non-index routes.

### Custom integrations

The root export provides `synchronizeItems`, `syncItems`, `ensureItemMetadata`, `toPublicUrl`, `siteRoot`, `isSyncEnabled`, and `getCloudflareClient` for custom content sources.

## Cloudflare setup

Provide the following build-only environment variables:

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_SEARCH_INSTANCE_ID=
CLOUDFLARE_AI_SEARCH_NAMESPACE=
CLOUDFLARE_AI_SEARCH_SYNC_ENABLED=true
```

The API token needs **Account / AI Search:Edit** and **Account / AI Search:Run** permissions. Never expose these credentials through Vite client configuration, Nuxt public runtime configuration, or a browser bundle.

Vite loads variables from its resolved mode and environment directory. VitePress loads production variables from the site root. Nuxt reads the build process environment. Explicit adapter options take precedence in every integration.

The adapters upload the complete local snapshot before deleting stale items from the AI Search `builtin` source. This includes manually uploaded built-in items. An empty snapshot therefore deletes all built-in items.

## Related packages

- [vitepress-plugin-cloudflare-ai-search](https://github.com/Barbapapazes/vitepress-plugin-cloudflare-ai-search) replaces VitePress 2 search with the Cloudflare AI Search UI.
- [docus-cloudflare-ai-search](https://github.com/Barbapapazes/docus-cloudflare-ai-search) replaces Docus search with Cloudflare AI Search.

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/barbapapazes">
    <img src="https://cdn.jsdelivr.net/gh/barbapapazes/static/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Estéban Soubiran](https://github.com/Barbapapazes)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/cloudflare-ai-search-sync/latest.svg?style=flat&colorA=000&colorB=171717
[npm-version-href]: https://npmjs.com/package/cloudflare-ai-search-sync

[npm-downloads-src]: https://img.shields.io/npm/dm/cloudflare-ai-search-sync.svg?style=flat&colorA=000&colorB=171717
[npm-downloads-href]: https://npmjs.com/package/cloudflare-ai-search-sync

[license-src]: https://img.shields.io/npm/l/cloudflare-ai-search-sync.svg?style=flat&colorA=000&colorB=171717
[license-href]: https://npmjs.com/package/cloudflare-ai-search-sync
