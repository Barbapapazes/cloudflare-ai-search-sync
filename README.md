# vite-plugin-cloudflare-ai-search-sync

> **Status:** project frame only. Markdown synchronization is not implemented yet.

A future Vite plugin for synchronizing Markdown files from a project to [Cloudflare AI Search built-in storage](https://developers.cloudflare.com/ai-search/configuration/data-source/built-in-storage/).

## Installation

```sh
pnpm add vite-plugin-cloudflare-ai-search-sync
```

## Usage

The package currently exports a no-op plugin so consumers can establish their integration before synchronization behavior arrives.

```ts
import { defineConfig } from 'vite'
import { cloudflareAISearchSync } from 'vite-plugin-cloudflare-ai-search-sync'

export default defineConfig({
  plugins: [cloudflareAISearchSync()],
})
```

## Planned synchronization behavior

The future plugin will run only in the build process. It will discover Markdown files, upload new or updated files to AI Search built-in storage, and remove remote items that no longer exist locally.

Built-in storage uses the Items API and indexes each upload immediately. Markdown is supported, with a 4 MB maximum file size. Upload keys identify source files, while deleting an item requires its remote item ID.

> [!WARNING]
> Future Cloudflare API tokens must remain server-side. Never expose account IDs, API tokens, or other credentials through Vite client configuration or a browser bundle. REST automation requires an API token with **AI Search:Edit** and **AI Search:Run** permissions.

## Development

The repository uses Node 24 and pnpm 11.21.0. The VitePress fixture is located in `.playgrounds/vitepress`.

## Repository

<https://github.com/Barbapapazes/vite-plugin-cloudflare-ai-search-sync>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Estéban Soubiran](https://github.com/Barbapapazes)
