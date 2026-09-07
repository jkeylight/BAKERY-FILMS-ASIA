// ─────────────────────────────────────────────────────────────
// BAKERY FILMS / AI — client-side router
// Barba-style wipe transitions between routes.
// ─────────────────────────────────────────────────────────────

export type RouteName = 'home' | 'work' | 'studio' | 'capabilities' | 'experiments' | 'contact'

export interface Route {
  name: RouteName
  path: string
  label: string
  num: string
}

export const ROUTES: Route[] = [
  { name: 'home',         path: '/',              label: 'OPENING',     num: '00' },
  { name: 'capabilities', path: '/capabilities',  label: 'WHAT WE MAKE', num: '01' },
  { name: 'work',         path: '/work',           label: 'THE WORK',    num: '02' },
  { name: 'studio',       path: '/studio',         label: 'THE STUDIO',  num: '03' },
  { name: 'experiments',  path: '/experiments',    label: 'EXPERIMENTS', num: '04' },
  { name: 'contact',      path: '/contact',        label: 'COMMISSION',  num: '05' },
]

export function routeByPath(path: string): Route {
  return ROUTES.find((r) => r.path === path) ?? ROUTES[0]
}

export function routeByName(name: string): Route {
  return ROUTES.find((r) => r.name === name) ?? ROUTES[0]
}

// ── Wipe transition ─────────────────────────────────────────
const WIPE_CLOSE_MS = 500
const WIPE_OPEN_MS = 660
const WIPE_TOTAL_MS = 1350

function getWipeEl(): HTMLElement | null {
  return document.getElementById('wipe')
}

export function wipeTransition(mid: () => void): Promise<void> {
  return new Promise((resolve) => {
    const w = getWipeEl()
    const MOTION = document.documentElement.classList.contains('motion')
    if (!MOTION || !w) {
      mid()
      resolve()
      return
    }
    // close bars
    w.classList.remove('on')
    void w.offsetWidth
    w.classList.add('on')
    // mid-point: swap content while fully covered
    window.setTimeout(() => mid(), WIPE_CLOSE_MS)
    // open bars
    window.setTimeout(() => w.classList.remove('on'), WIPE_CLOSE_MS + WIPE_OPEN_MS)
    // done
    window.setTimeout(() => resolve(), WIPE_TOTAL_MS)
  })
}

// ── Router ──────────────────────────────────────────────────
type BeforeNavigate = (from: Route, to: Route) => boolean | Promise<boolean>
type OnNavigate = (to: Route, container: HTMLElement) => void | Promise<void>

let currentRoute: Route = routeByPath(location.pathname)
let container: HTMLElement | null = null
let beforeHooks: BeforeNavigate[] = []
let onNavigateHooks: OnNavigate[] = []

export function getCurrentRoute(): Route { return currentRoute }

export function onBeforeNavigate(hook: BeforeNavigate) {
  beforeHooks.push(hook)
}

export function onNavigate(hook: OnNavigate) {
  onNavigateHooks.push(hook)
}

/** Intercept all clicks on internal links with [data-route] */
function interceptClicks(e: Event) {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-route]')
  if (!a) return
  e.preventDefault()
  const path = a.getAttribute('href') ?? a.dataset.route ?? '/'
  navigateTo(path)
}

/** Push state + wipe + swap content */
export async function navigateTo(path: string, pushState = true) {
  const to = routeByPath(path)
  if (to.path === currentRoute.path) return

  // allow hooks to block navigation
  for (const hook of beforeHooks) {
    const ok = await hook(currentRoute, to)
    if (ok === false) return
  }

  if (pushState) {
    history.pushState({ path: to.path }, '', to.path)
  }

  const prev = currentRoute
  currentRoute = to

  // Content swap happens during the wipe mid-point (while screen is covered)
  await wipeTransition(() => {
    if (!container) return
    window.scrollTo(0, 0)
    // Render new page content
    for (const hook of onNavigateHooks) {
      hook(to, container) // sync during mid-point
    }
  })

  // update active nav state
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('href') === to.path)
  })
}

function handlePopState() {
  const path = location.pathname
  const to = routeByPath(path)
  if (to.path === currentRoute.path) return
  navigateTo(to.path, false)
}

export function initRouter(c: HTMLElement) {
  container = c
  document.addEventListener('click', interceptClicks)
  window.addEventListener('popstate', handlePopState)

  // set initial active state
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('href') === currentRoute.path)
  })
}
