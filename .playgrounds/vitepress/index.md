# Cloudflare AI Search Sync Playground

This VitePress site exercises the plugin's production-only AI Search metadata check and exposes a public [Cloudflare AI Search](https://search.vpcass-vitepress.barbapapazes.dev) interface in the VitePress navbar. Open the search button or press <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> to search the indexed documentation.

The browser search interface uses the public endpoint only. It does not use, and must never receive, Cloudflare API tokens or other credentials.

## Try it

Set the Cloudflare account ID, API token, AI Search instance ID, and AI Search namespace in the local `.env` file beside this page. The token needs **Account / AI Search:Edit** and **Account / AI Search:Run** permissions.

Then build this fixture from the repository root:

```sh
pnpm --filter cloudflare-ai-search-sync-vitepress-playground build
```

The build verifies that the target instance declares `icon` as a text custom metadata field. It adds the field when missing, preserves other custom metadata fields, and fails without updating an invalid `icon` declaration.

In Cloudflare AI Search, add the local VitePress development origin and the deployed playground origin to the endpoint's authorized hosts. The search endpoint can only return results after the origin is authorized and the documentation has been indexed.

See the [Markdown examples](./markdown-examples) for additional fixture content.
