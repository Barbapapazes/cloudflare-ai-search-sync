export interface VitePressSiteConfig {
  cleanUrls?: boolean
  logger: { info: (message: string) => void }
  pages: string[]
  rewrites: { map: Record<string, string | undefined> }
  root: string
  site: { base: string }
  srcDir: string
}
