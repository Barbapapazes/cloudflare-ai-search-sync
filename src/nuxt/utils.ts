import type { FileAfterParseHook } from '@nuxt/content'
import type { SyncItem } from '../sync.js'
import { extname, relative, sep } from 'node:path'
import { extractMarkdownMetadata } from '../markdown.js'

export function toNuxtContentItem(
  context: FileAfterParseHook,
  rootDir: string,
  baseURL: string,
): SyncItem | undefined {
  if (!isPublishedMarkdownPage(context))
    return

  const route = context.content.path as string | undefined
  if (!route)
    return

  const key = toPosixPath(relative(rootDir, context.file.path))
  const metadata = extractMarkdownMetadata(context.file.body, key)

  return {
    content: context.file.body,
    description: stringValue(context.content.description) ?? metadata.description,
    icon: 'page',
    key,
    title: stringValue(context.content.title) ?? metadata.title,
    url: withBaseURL(route, baseURL),
  }
}

export function isPublishedMarkdownPage(context: FileAfterParseHook): boolean {
  return context.collection?.type === 'page'
    && context.content.draft !== true
    && !isDraftMetadata(context.content.meta)
    && (context.file.extension === '.md' || context.content.extension === '.md' || extname(context.file.path) === '.md')
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

function isDraftMetadata(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'draft' in value && value.draft === true
}
