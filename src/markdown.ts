import { basename } from 'node:path'

export interface MarkdownMetadata {
  description: string
  title: string
}

/** Extracts the document metadata required by Cloudflare AI Search. */
export function extractMarkdownMetadata(content: string, key: string): MarkdownMetadata {
  const { frontmatter, markdown } = splitFrontmatter(content)
  const title = frontmatterValue(frontmatter, 'title')
    ?? firstHeading(markdown)
    ?? basename(key, '.md')
  const description = frontmatterValue(frontmatter, 'description')
    ?? firstParagraph(markdown)
    ?? title

  return { description, title }
}

function splitFrontmatter(content: string): { frontmatter: string, markdown: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match
    ? { frontmatter: match[1], markdown: content.slice(match[0].length) }
    : { frontmatter: '', markdown: content }
}

function frontmatterValue(frontmatter: string, field: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'))
  if (!match)
    return

  const value = match[1].trim().replace(/^(['"])(.*)\1$/, '$2').trim()
  return toPlainText(value)
}

function firstHeading(markdown: string): string | undefined {
  for (const line of markdown.split(/\r?\n/)) {
    const marker = line.match(/^#{1,6}[ \t]+/)
    if (!marker)
      continue

    return toPlainText(line.slice(marker[0].length).replace(/[ \t]+#+[ \t]*$/, ''))
  }
}

function firstParagraph(markdown: string): string | undefined {
  const lines = markdown.split(/\r?\n/)
  const paragraph: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (paragraph.length > 0)
        break
      continue
    }
    if (trimmed.startsWith('#'))
      continue
    paragraph.push(trimmed)
  }

  return paragraph.length > 0 ? toPlainText(paragraph.join(' ')) : undefined
}

function toPlainText(value: string): string | undefined {
  const text = value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text || undefined
}
