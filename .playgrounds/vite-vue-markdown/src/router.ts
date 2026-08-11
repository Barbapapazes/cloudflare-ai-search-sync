import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import Guide from './pages/guide/index.md'
import Introduction from './pages/guide/introduction.md'
import Home from './pages/index.md'

const routes: RouteRecordRaw[] = [
  { component: Home, path: '/' },
  { component: Guide, path: '/guide/' },
  { component: Introduction, path: '/guide/introduction' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
