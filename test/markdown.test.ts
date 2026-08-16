import { describe, expect, it } from 'vitest'
import { extractMarkdownMetadata } from '../src/markdown.js'

describe('extractMarkdownMetadata', () => {
  it('prefers title and description frontmatter', () => {
    expect(extractMarkdownMetadata(`---
title: "Getting *started*"
description: Learn the **essentials**.
---
# Ignored heading

Ignored paragraph.`, 'guide.md')).toEqual({
      description: 'Learn the essentials.',
      title: 'Getting started',
    })
  })

  it('falls back to the first heading, paragraph, and file name', () => {
    expect(extractMarkdownMetadata('# Guide [overview](#overview)\n\nLearn the **essentials**.', 'guide.md')).toEqual({
      description: 'Learn the essentials.',
      title: 'Guide overview',
    })
    expect(extractMarkdownMetadata('', 'nested/guide.md')).toEqual({
      description: 'guide',
      title: 'guide',
    })
  })
})
