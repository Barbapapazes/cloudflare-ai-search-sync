import type { SiteConfig } from 'vitepress'
import type { SyncItem } from '../sync.js'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { extractMarkdownMetadata } from '../markdown.js'
import { siteRoot, toPublicUrl } from '../urls.js'

export async function readVitePressPages(siteConfig: SiteConfig): Promise<SyncItem[]> {
  const pages = siteConfig.pages.map((page) => {
    const route = siteConfig.rewrites.map[page] ?? page
    return {
      page,
      url: toPublicUrl(route, siteConfig.site.base, siteConfig.cleanUrls),
    }
  }).filter(({ url }) => url !== siteRoot(siteConfig.site.base))

  return Promise.all(pages.map(async ({ page, url }) => {
    const content = await readFile(resolve(siteConfig.srcDir, page), 'utf8')
    return {
      content,
      icon: 'page',
      key: page,
      ...extractMarkdownMetadata(content, page),
      url,
    }
  }))
}
