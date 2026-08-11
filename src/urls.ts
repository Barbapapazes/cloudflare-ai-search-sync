export function toPublicUrl(route: string, base: string, cleanUrls = false): string {
  const pathname = route.replace(/\.md$/, '')
  const publicPath = pathname === 'index'
    ? '/'
    : pathname.endsWith('/index')
      ? `/${pathname.slice(0, -'index'.length)}`
      : cleanUrls ? `/${pathname}` : `/${pathname}.html`
  const basePath = base.replace(/^\/+|\/+$/g, '')
  return `${basePath ? `/${basePath}` : ''}${publicPath}`
}

export function siteRoot(base: string): string {
  const basePath = base.replace(/^\/+|\/+$/g, '')
  return basePath ? `/${basePath}/` : '/'
}
