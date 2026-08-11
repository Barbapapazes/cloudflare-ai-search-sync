import type { SyncItem } from '../sync.js'
import type { NuxtContentAfterParseContext } from './types.js'
import { extname, relative, sep } from 'node:path'

export function toNuxtContentItem(
  context: NuxtContentAfterParseContext,
  rootDir: string,
  baseURL: string,
): SyncItem | undefined {
  if (!isPublishedMarkdownPage(context))
    return

  const route = context.content.path
  if (!route)
    return

  return {
    content: context.file.body,
    key: toPosixPath(relative(rootDir, context.file.path)),
    url: withBaseURL(route, baseURL),
  }
}

export function isPublishedMarkdownPage(context: NuxtContentAfterParseContext): boolean {
  return context.collection?.type === 'page'
    && (context.file.extension === '.md' || context.content.extension === '.md' || extname(context.file.path) === '.md')
    && context.content.draft !== true
    && context.content.meta?.draft !== true
}

export function withBaseURL(route: string, baseURL: string): string {
  const base = baseURL.replace(/^\/+|\/+$/g, '')
  const path = route.replace(/^\/+/, '')
  return base ? `/${base}/${path}`.replace(/\/$/, path ? '' : '/') : `/${path}`
}

function toPosixPath(path: string): string {
  return sep === '/' ? path : path.replaceAll(sep, '/')
}
