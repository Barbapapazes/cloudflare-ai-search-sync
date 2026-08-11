/** A raw Markdown file discovered by a content source. */
export interface SourceFile {
  /** Absolute path to the file on disk. */
  absolutePath: string
  /** POSIX path relative to the Vite project root. */
  relativePath: string
  /** Unmodified file contents. */
  content: string
}

/** Context Vite supplies to a content source while building. */
export interface SourceContext {
  /** Absolute Vite project root, resolved during `configResolved`. */
  root: string
}

/** Reads Markdown files to upload to the AI Search built-in store. */
export interface ContentSource {
  read: (context: SourceContext) => AsyncIterable<SourceFile>
}
