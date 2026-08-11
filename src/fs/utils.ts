import type { SyncItem } from '../sync.js'
import { readdir, readFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { toPublicUrl } from '../urls.js'

export async function readMarkdownFiles(
  folder: string,
  base: string,
  cleanUrls = false,
): Promise<SyncItem[]> {
  const paths = await findMarkdownFiles(folder)

  return Promise.all(paths.map(async (filePath) => {
    const key = toPosixPath(relative(folder, filePath))
    return {
      content: await readFile(filePath, 'utf8'),
      key,
      url: toPublicUrl(key, base, cleanUrls),
    }
  }))
}

async function findMarkdownFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(folder, entry.name)
    if (entry.isDirectory())
      return findMarkdownFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : []
  }))

  return paths.flat().sort((left, right) => left.localeCompare(right))
}

function toPosixPath(path: string): string {
  return sep === '/' ? path : path.replaceAll(sep, '/')
}
