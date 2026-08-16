import type { SyncItem } from '../sync.js'
import type { NuxtContentAfterParseContext } from './types.js'
import { extname, relative, sep } from 'node:path'
import { extractMarkdownMetadata } from '../markdown.js'

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

  const key = toPosixPath(relative(rootDir, context.file.path))
  const metadata = extractMarkdownMetadata(context.file.body, key)

  return {
    content: context.file.body,
    description: stringValue(context.content.description) ?? metadata.description,
    key,
    title: stringValue(context.content.title) ?? metadata.title,
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

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
