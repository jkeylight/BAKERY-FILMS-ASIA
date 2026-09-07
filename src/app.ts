// ─────────────────────────────────────────────────────────────
// BAKERY FILMS / AI — runtime (routed)
// ─────────────────────────────────────────────────────────────
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

import { WORKS, REEL_WORDS, type Motif, type Work } from './content'
import { paintCanvas, paintGhost, renderFrame, type GhostMode } from './paint'
import { ROUTES, initRouter, navigateTo, getCurrentRoute, wipeTransition, routeByPath, onNavigate, type RouteName } from './router'
import { renderPage } from './pages'

gsap.registerPlugin(ScrollTrigger)

// ── helpers ─────────────────────────────────────────────────
const qs = <T extends HTMLElement>(sel: string, root: ParentNode = document): T =>
  root.querySelector(sel) as T
const qsa = <T extends HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll(sel))

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FORCE_MOTION = new URLSearchParams(location.search).has('motion')
// Always show preloader; only skip if user prefers reduced motion and no ?motion flag
const MOTION = FORCE_MOTION || !REDUCED_MOTION
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches

if (MOTION) document.documentElement.classList.add('motion')
if (FINE) document.body.classList.add('has-fine')

const fmt = (n: number) => String(n).padStart(2, '0')
const fmtTC = (total: number) => {
  const t = Math.max(0, Math.min(total, 3599))
  return `${fmt(Math.floor(t / 60))}:${fmt(Math.floor(t % 60))}`
}
function setText(el: HTMLElement | null, t: string) { if (el) el.textContent = t }

// ── cinematic cut helpers ────────────────────────────────────
const nz = (i: number) => ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1

function distortCanvas(
  canvas: HTMLCanvasElement, paintNext: () => void,
  opt: { dur?: number; slices?: number } = {}
) {
  const dur = opt.dur ?? 320, slices = opt.slices ?? 12
  const w = canvas.width, h = canvas.height
  if (!w || !h) { paintNext(); return }
  const oldC = document.createElement('canvas'); oldC.width = w; oldC.height = h
  const og = oldC.getContext('2d')!; og.drawImage(canvas, 0, 0)
  paintNext()
  const g = canvas.getContext('2d')!, rh = h / slices
  const t0 = performance.now(), amp = Math.max(10, Math.min(90, h * 0.24))
  const step = () => {
    const t = Math.min(1, (performance.now() - t0) / dur), k = 1 - t
    const ease = k * k * (3 - 2 * k)
    if (ease < 0.015) return
    for (let s = 0; s < slices; s++) {
      const sy = s * rh
      if (nz(s * 13 + 7) < 0.14 * ease) continue
      const dx = (nz(s * 31 + 5) * 2 - 1) * amp * ease
      const wob = (nz(s * 7 + t * 991) * 2 - 1) * ease * 8
      g.drawImage(oldC, 0, sy, w, rh + 2, dx, sy + wob, w, rh + 2)
    }
    if (t < 1) window.setTimeout(step, 16)
  }
  window.setTimeout(step, 16)
}

// ── scroll-scrubbed frames ──────────────────────────────────
const scrubKills: Array<() => void> = []
const scrubPolls: Array<() => void> = []

function attachScrub(el: HTMLElement, onP: (p: number) => void, container: HTMLElement | Window = window) {
  let lastP = -1
  const update = () => {
    const vh = container === window ? innerHeight : (container as HTMLElement).clientHeight
    const r = el.getBoundingClientRect()
    if (!r.height) return
    const p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)))
    if (p !== lastP) { lastP = p; onP(p) }
  }
  const killLenis = container === window && lenis ? lenis.on('scroll', update) : null
  container.addEventListener('scroll', update, { passive: true })
  scrubPolls.push(update)
  update()
  return () => {
    killLenis?.()
    container.removeEventListener('scroll', update)
    const i = scrubPolls.indexOf(update)
    if (i >= 0) scrubPolls.splice(i, 1)
  }
}

function startScrubLoop() {
  if (!MOTION) return
  window.setInterval(() => scrubPolls.forEach((p) => p()), 40)
}

function buildScrubs() {
  scrubKills.forEach((k) => k())
  scrubKills.length = 0
  if (!MOTION) return
  qsa<HTMLCanvasElement>('#work-list .w-canvas').forEach((el) => {
    const w = el.width, h = el.height
    if (!w || !h) return
    const seed = el.dataset.seed ?? 'w', motif = el.dataset.motif as Motif | undefined
    const W2 = Math.round(w * 1.55)
    const base = renderFrame(W2, h, { seed, motif, v: 0.12 })
    const dir = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0)
    const travel = W2 - w, ctx = el.getContext('2d')!
    const draw = (p: number) => {
      const x = dir % 2 === 0 ? travel * (1 - p) : travel * p
      ctx.drawImage(base, x, 0, w, h, 0, 0, w, h)
    }
    scrubKills.push(attachScrub(el, draw))
  })
}

// ── canvas painting ──────────────────────────────────────────
function paintStaticCanvases() {
  qsa<HTMLCanvasElement>('.w-canvas').forEach((c) => {
    paintCanvas(c, { seed: c.dataset.seed ?? 'f', motif: c.dataset.motif as never, v: parseFloat(c.dataset.v ?? '0') })
  })
  qsa<HTMLCanvasElement>('canvas[data-paint]').forEach((c) => {
    const seed = c.dataset.paint ?? 'frag'
    const motif = { 'frag-c1': 'woman', 'frag-c2': 'city', 'frag-c3': 'tokyo' }[seed] as never
    paintCanvas(c, { seed, motif })
  })
}

let resizeTimer = 0
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    paintStaticCanvases()
    if (reelOpen) paintReelFrame()
    buildScrubs()
  }, 160)
})

// ── cursor ──────────────────────────────────────────────────
function initCursor() {
  if (!FINE) return
  const ring = qs('#cursor'), dot = qs('#cursor-dot'), label = qs('#cursor-label')
  let rx = innerWidth / 2, ry = innerHeight / 2, mx = rx, my = ry
  const move = (x: number, y: number) => { mx = x; my = y }
  window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
  window.addEventListener('pointerdown', () => ring?.classList.add('is-down'))
  window.addEventListener('pointerup', () => ring?.classList.remove('is-down'))
  ;(function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16
    if (ring) ring.style.transform = `translate(${rx - ring.offsetWidth / 2}px, ${ry - ring.offsetHeight / 2}px)`
    if (dot) dot.style.transform = `translate(${mx - 1.5}px, ${my - 1.5}px)`
    requestAnimationFrame(loop)
  })()
  const activate = (text: string | null) => {
    ring?.classList.toggle('is-active', !!text)
    if (label) label.textContent = text ?? ''
  }
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement
    const tagged = t.closest('[data-cursor]') as HTMLElement | null
    const work = t.closest('.work') as HTMLElement | null
    activate(tagged?.dataset.cursor ?? (work ? 'OPEN' : null))
  })
  document.addEventListener('pointerout', () => activate(null))
}

// ── loader + opening intro ──────────────────────────────────
const loader = qs('#loader')
const loaderFill = qs('#loader-fill')
const loaderCount = qs('#loader-count')
const loaderNote = qs('#loader-note')
let introStarted = false

function bootLoader(): Promise<void> {
  return new Promise((resolve) => {
    loader?.classList.remove('done')
    const notes = ['LOADING SCENE 001', 'FETCHING LIGHT', 'DRESSING THE SET', 'ROLL CAMERA']
    let p = 0
    let finished = false
    let safetyTimer = 0
    const finish = () => {
      if (finished) return
      finished = true
      clearInterval(noteTick)
      clearTimeout(safetyTimer)
      loader?.classList.add('done')
      resolve()
    }
    const step = () => {
      p = Math.min(100, p + 4 + Math.random() * 9)
      if (loaderFill) loaderFill.style.width = `${p}%`
      setText(loaderCount, fmt(Math.floor(p)))
      if (p < 100) setTimeout(step, 42 + Math.random() * 90)
      else {
        setText(loaderCount, '000')
        setText(loaderNote, 'CAMERA ROLLING — SCENE 001')
        setTimeout(finish, 260)
      }
    }
    let i = 0
    const noteTick = setInterval(() => { i++; setText(loaderNote, notes[i % notes.length]) }, 420)
    setTimeout(step, 380)
    safetyTimer = window.setTimeout(finish, 3600)
  })
}

function playOpeningIntro() {
  if (!MOTION || introStarted) return
  introStarted = true
  gsap.timeline({ delay: 0.05 })
    .to('.ol .ol-i', { y: '0%', duration: 1.15, ease: 'power4.out', stagger: 0.14 }, 0.05)
    .to('.open-frags .frag', { autoAlpha: 1, duration: 1, ease: 'power2.out', stagger: 0.18 }, 0.9)
    .fromTo('#open-tc', { opacity: 0, letterSpacing: '0.85em' }, { opacity: 1, letterSpacing: '0.6em', duration: 1.2, ease: 'power3.out' }, 0)
}

// ── lenis + scroll rails + reveals ─────────────────────────
let lenis: Lenis | null = null
let lenisTickerAdded = false
let sceneEntered = false

/** Initialize Lenis ONCE at boot — never destroy it across routes. */
function initLenis() {
  if (!MOTION || lenis) return
  lenis = new Lenis({ duration: 1.25, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  if (!lenisTickerAdded) {
    gsap.ticker.add((time) => lenis?.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    lenisTickerAdded = true
  }
}

/** Per-page scroll setup — kills only ScrollTriggers, never Lenis. */
function initScroll() {
  if (!MOTION) return
  // Kill only ScrollTrigger instances (not Lenis)
  ScrollTrigger.getAll().forEach((t) => t.kill())
  sceneEntered = false
  introStarted = false

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const tc = fmtTC(self.progress * 360)
      setText(qs('#tc-rail'), `00:${tc}`)
      if (sceneEntered) setText(qs('#open-tc'), `00:${tc}`)
      const fill = qs('#progress-fill')
      if (fill) fill.style.height = `${(self.progress * 100).toFixed(2)}%`
    },
  })

  gsap.set('[data-reveal]', { autoAlpha: 0, y: 34 })

  const reveals = qsa<HTMLElement>('[data-reveal]')
  if (reveals.length) {
    ScrollTrigger.batch(reveals, {
      start: 'top 88%',
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.05, ease: 'power3.out', overwrite: true, stagger: 0.08 }),
    })
  }
}

function initSceneOpen() {
  if (!MOTION) return
  const drive = qs('#act-drive')
  const bg = qs<HTMLCanvasElement>('#open-bg')
  const cutStage = qs('#cut-stage')
  const cutWord = qs('#cut-word')
  const cuts = [
    { word: 'FILM', motif: 'hotel' as const },
    { word: 'COMMERCIAL', motif: 'city' as const },
    { word: 'IMAGE', motif: 'woman' as const },
    { word: 'MOTION', motif: 'tokyo' as const },
  ]
  if (!drive || !bg || !cutStage || !cutWord) return
  paintCanvas(bg, { seed: 'open-0', motif: 'city' })

  const showCut = (i: number) => {
    setText(cutWord, cuts[i].word)
    distortCanvas(bg, () => paintCanvas(bg, { seed: `open-${i}`, motif: cuts[i].motif }), { dur: 300, slices: 10 })
    cutWord.classList.remove('cut')
    void cutWord.offsetWidth
    cutWord.classList.add('cut')
  }

  gsap.set('#open-sub', { autoAlpha: 0 })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: drive, start: 'top top', end: 'bottom bottom', scrub: 0.6,
      onEnter: () => { sceneEntered = true; cutStage.classList.add('is-live') },
      onLeaveBack: () => { cutStage.classList.remove('is-live'); sceneEntered = false },
      onLeave: () => cutStage.classList.remove('is-live'),
    },
  })

  tl.call(() => showCut(0), undefined, 1.2)
    .to('.open-lines', { autoAlpha: 0.25, yPercent: -10, duration: 1.6, ease: 'power1.inOut' }, 0.9)
    .call(() => showCut(1), undefined, 3.1)
    .call(() => showCut(2), undefined, 5.0)
    .call(() => showCut(3), undefined, 6.9)
    .to('.open-stage .open-tc', { autoAlpha: 0, duration: 0.6 }, 7.1)
    .to('.open-lines', { autoAlpha: 0, yPercent: -18, duration: 1.1 }, 7.6)
    .fromTo('#open-sub', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1 }, 8.3)
    .to('.open-frags .frag', { yPercent: -9, autoAlpha: 0.4, duration: 1.6, stagger: 0.25 }, 7.4)
}

// ── ACT II ghost previews ───────────────────────────────────
function initGhost() {
  const field = qs('#make-field')
  const ghost = qs('#ghost')
  const canvas = qs<HTMLCanvasElement>('#ghost-canvas')
  const tag = qs('#ghost-tag')
  if (!field || !ghost || !FINE) return

  let lastX = innerWidth / 2, lastY = innerHeight / 2, activeRow: HTMLElement | null = null

  field.addEventListener('pointermove', (e) => { lastX = e.clientX; lastY = e.clientY; if (activeRow) positionGhost() })
  field.addEventListener('pointerenter', (e) => hover((e.target as HTMLElement).closest('.mk') as HTMLElement))
  field.addEventListener('pointerover', (e) => { const row = (e.target as HTMLElement).closest('.mk') as HTMLElement; if (row && row !== activeRow) hover(row) })
  field.addEventListener('pointerleave', () => {
    activeRow = null; ghost.classList.remove('is-on')
    field.querySelectorAll('.mk.is-hover').forEach((r) => r.classList.remove('is-hover'))
  })

  function hover(row: HTMLElement | null) {
    if (!row) return
    field.querySelectorAll('.mk.is-hover').forEach((r) => r.classList.remove('is-hover'))
    activeRow = row; row.classList.add('is-hover')
    const mode = (row.dataset.mode ?? 'cinema') as GhostMode
    ghost.className = `ghost ghost--${mode} is-on`
    if (tag) tag.textContent = `${row.dataset.name ?? ''} — ${row.dataset.cap ?? ''}`
    requestAnimationFrame(() => paintGhost(canvas!, row.dataset.seed ?? 'mk', mode))
    positionGhost()
  }
  function positionGhost() { ghost.style.left = `${Math.min(lastX + 24, innerWidth - 40)}px`; ghost.style.top = `${lastY}px` }
}

// ── work case overlay ───────────────────────────────────────
const CHAPTERS: [string, string][] = [
  ['CONCEPT', 'WORLD · LOGIC · RULES'],
  ['ART DIRECTION', 'LIGHT · MATERIAL · GRAIN'],
  ['IMAGE DEVELOPMENT', 'SELECTION · REFINEMENT · RETOUCH'],
  ['MOTION', 'CAMERA · VELOCITY · EDIT'],
  ['FINAL FILM', 'GRADE · SOUND · DELIVERY'],
]

const caseOverlay = qs('#case-overlay')
const caseBody = qs('#case-body')
let caseIdx = 0
let lastFocus: HTMLElement | null = null
let caseScrubKill: (() => void) | null = null
let caseWiping = false

function destroyCaseScrub() { caseScrubKill?.(); caseScrubKill = null }

function buildCaseScrub() {
  destroyCaseScrub()
  if (!MOTION) return
  const el = qs<HTMLCanvasElement>('.cs-canvas', caseBody!)
  const box = qs('#case-scroll')
  if (!el || !box) return
  const w = el.width, h = el.height
  if (!w || !h) return
  const seed = el.dataset.seed ?? 'cs', motif = el.dataset.motif as Motif | undefined
  const W2 = Math.round(w * 1.6)
  const base = renderFrame(W2, h, { seed, motif, v: 0.5 })
  const travel = W2 - w, ctx = el.getContext('2d')!
  caseScrubKill = attachScrub(el, (p) => ctx.drawImage(base, travel * p, 0, w, h, 0, 0, w, h), box)
}

function animateCaseHero() {
  if (!MOTION || !caseOverlay) return
  caseOverlay.classList.remove('hero-in')
  void caseOverlay.offsetWidth
  caseOverlay.classList.add('hero-in')
}

function showCase() {
  if (!caseOverlay) return
  caseOverlay.hidden = false
  caseOverlay.classList.remove('closing')
  document.body.classList.add('locked')
  lenis?.stop()
  qs('#case-scroll')?.scrollTo({ top: 0 })
  qs('#case-close')?.focus()
}

async function openWork(id: string) {
  const idx = WORKS.findIndex((w) => w.id === id)
  if (idx < 0 || !caseOverlay || !caseBody || caseWiping) return
  caseIdx = idx
  lastFocus = document.activeElement as HTMLElement
  renderCase()
  caseWiping = true
  await wipeScreen(() => { showCase(); animateCaseHero() })
  caseWiping = false
  buildCaseScrub()
}

async function closeCase() {
  if (!caseOverlay || caseOverlay.hidden || caseWiping) return
  destroyCaseScrub()
  caseWiping = true
  await wipeScreen(() => {
    caseOverlay!.classList.add('closing')
    caseOverlay!.hidden = true
    document.body.classList.remove('locked')
    lenis?.start()
  })
  caseWiping = false
  lastFocus?.focus?.()
  window.dispatchEvent(new CustomEvent('case-close'))
}

async function wipeScreen(mid: () => void): Promise<void> {
  return new Promise((resolve) => {
    const w = qs('#wipe')
    if (!MOTION || !w) { mid(); resolve(); return }
    w.classList.remove('on'); void w.offsetWidth; w.classList.add('on')
    window.setTimeout(() => mid(), 500)
    window.setTimeout(() => w.classList.remove('on'), 660)
    window.setTimeout(() => resolve(), 1350)
  })
}

function gotoCase(idx: number) {
  if (idx < 0 || idx >= WORKS.length || caseWiping) return
  destroyCaseScrub()
  caseIdx = idx
  renderCase()
  qs('#case-scroll')?.scrollTo({ top: 0 })
  window.setTimeout(() => { animateCaseHero(); buildCaseScrub() }, 60)
}

function renderCase() {
  const w = WORKS[caseIdx]
  if (!w || !caseBody) return
  setText(qs('#case-cat'), `CASE FILE ${w.no}/05 — ${w.cat} — ${w.runtime}`)
  setText(qs('#case-pos'), `${w.no} / ${fmt(WORKS.length)}`)
  setText(qs('#case-prev'), caseIdx > 0 ? `← ${WORKS[caseIdx - 1].no}` : '← PREV')
  setText(qs('#case-next'), caseIdx < WORKS.length - 1 ? `${WORKS[caseIdx + 1].no} →` : 'NEXT →')

  // Determine media type for the case projection
  let mediaHtml = ''
  if (w.video) {
    mediaHtml = `
      <div class="cs-projection cs-projection--video">
        <video class="cs-video" src="${escapeHtml(w.video.src)}" ${w.video.poster ? `poster="${escapeHtml(w.video.poster)}"` : ''} muted loop preload="metadata" playsinline></video>
        <canvas class="cs-canvas" data-seed="cs-${w.id}" data-motif="${w.motif}" data-v="0"></canvas>
      </div>`
  } else if (w.poster) {
    mediaHtml = `
      <div class="cs-projection cs-projection--still">
        <img class="cs-still" src="${escapeHtml(w.poster)}" alt="${escapeHtml(w.titleLines.map(l => l.t).join(' '))}" />
        <canvas class="cs-canvas" data-seed="cs-${w.id}" data-motif="${w.motif}" data-v="0"></canvas>
      </div>`
  } else {
    mediaHtml = `<canvas class="cs-canvas" data-seed="cs-${w.id}" data-motif="${w.motif}" data-v="0"></canvas>`
  }

  caseBody.innerHTML = `
    <section class="cs-kicker anim-hero">
      <p class="meta accent">${escapeHtml(w.cat)}</p>
      <p class="meta">${w.runtime} — ${w.year} — ${escapeHtml(w.format)}</p>
    </section>
    <h2 class="cs-title anim-hero">
      ${w.titleLines.map((l, li) => `<span class="cs-l ${l.major ? 'cs-l-major' : ''}" style="--i:${li}">${escapeHtml(l.t)}</span>`).join('')}
    </h2>
    <p class="cs-lede anim-hero">${escapeHtml(w.lede)}</p>

    <figure class="cs-film anim-hero">
      ${mediaHtml}
      <figcaption class="cs-film-cap">${w.video ? 'PROJECTION — REAL FOOTAGE' : w.poster ? 'PROJECTION — STILL IMAGE' : 'PROJECTION — SCRUB THE SCROLL · DROP FINAL FOOTAGE INTO CONTENT.TS'}</figcaption>
    </figure>

    <div class="cs-beats" data-reveal>
      ${w.beats.map((b, i) => `<p class="cb-l" style="transition-delay:${i * 70}ms">${escapeHtml(b)}</p>`).join('')}
    </div>

    <section class="cs-chapters" data-reveal>
      ${CHAPTERS.map(([n, note]) => `<div class="cs-ch"><span class="cs-ch-name">${n}</span><span class="cs-ch-note">${note}</span></div>`).join('')}
    </section>

    <dl class="cs-credits" data-reveal>
      ${w.credits.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
    </dl>
  `

  requestAnimationFrame(() => {
    const c = qs<HTMLCanvasElement>('.cs-canvas', caseBody!)
    if (c) paintCanvas(c, { seed: c.dataset.seed, motif: c.dataset.motif as never, v: 0 })
    // If there's a video, set up scrub-to-play
    const vid = qs<HTMLVideoElement>('.cs-video', caseBody)
    if (vid && MOTION) {
      vid.play().catch(() => {})
      const vidBox = qs('#case-scroll')
      if (vidBox) {
        vidBox.addEventListener('scroll', () => {
          const r = vid.getBoundingClientRect()
          const vh = innerHeight
          const p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)))
          if (vid.duration) vid.currentTime = p * vid.duration
        }, { passive: true })
      }
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { (en.target as HTMLElement).classList.add('is-in'); obs.unobserve(en.target) }
      })
    }, { rootMargin: '0px 0px -8% 0px' })
    qsa<HTMLElement>('[data-reveal]', caseBody!).forEach((el) => obs.observe(el))
    qsa<HTMLElement>('.cb-l', caseBody!).forEach((el) => obs.observe(el))
  })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

function initCase() {
  qs('#case-close')?.addEventListener('click', () => void closeCase())
  qs('#case-prev')?.addEventListener('click', () => gotoCase(caseIdx - 1))
  qs('#case-next')?.addEventListener('click', () => gotoCase(caseIdx + 1))
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('.work')
    if (link) { e.preventDefault(); void openWork(link.dataset.work ?? '') }
  })
}

// ── reel ────────────────────────────────────────────────────
const reel = qs('#reel')
const reelCanvas = qs<HTMLCanvasElement>('#reel-canvas')
let reelTimer = 0, reelOpen = false, reelCut = 0
const REEL_MOTIFS: Work['motif'][] = ['hotel', 'city', 'woman', 'desert', 'tokyo']

function paintReelFrame() {
  if (!reelCanvas) return
  reelCut++
  const motif = REEL_MOTIFS[reelCut % REEL_MOTIFS.length], seed = `reel-${reelCut}`
  const paintNew = () => paintCanvas(reelCanvas, { seed, motif, v: (reelCut * 0.37) % 1, flip: reelCut % 2 === 0 })
  if (reelCut > 1 && reelCut % 2 === 0) distortCanvas(reelCanvas, paintNew, { dur: 260, slices: 10 })
  else paintNew()
  setText(qs('#reel-idx'), `CUT ${fmt(reelCut)}`)
  setText(qs('#reel-cap'), REEL_WORDS[reelCut % REEL_WORDS.length])
  const flash = qs('.reel-flash')
  if (flash) { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go') }
}

function openReel() {
  if (!reel) return
  reelOpen = true; lastFocus = document.activeElement as HTMLElement
  reel.hidden = false; document.body.classList.add('locked'); lenis?.stop()
  qs('#reel-close')?.focus()
  requestAnimationFrame(() => { reelCut = 0; paintReelFrame(); reelTimer = window.setInterval(paintReelFrame, 880) })
}
function closeReel() {
  if (!reel) return
  reelOpen = false; window.clearInterval(reelTimer); reel.hidden = true
  document.body.classList.remove('locked'); lenis?.start(); lastFocus?.focus?.()
}
function initReel() {
  qs('#reel-open')?.addEventListener('click', openReel)
  qs('#reel-open-2')?.addEventListener('click', openReel)
  qs('#reel-close')?.addEventListener('click', closeReel)
  reel?.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('button')) closeReel() })
}

// ── commission ──────────────────────────────────────────────
function initCommission() {
  const form = qs('#order-form')
  if (!form) return
  const state: Record<string, string> = { kind: '', brief: '', when: '', budget: '', name: '', mail: '' }
  const kindList = qs('#kind-list')
  const brief = qs<HTMLTextAreaElement>('#brief-txt')
  const nameEl = qs<HTMLInputElement>('#client-name')
  const mailEl = qs<HTMLInputElement>('#client-mail')
  const note = qs('#form-note')

  const stepRow = (step: string) => qs(`#pipeline li[data-step="${step}"]`)
  const setRow = (step: string, text: string, done = true) => {
    const row = stepRow(step)
    if (!row) return
    const st = qs('.p-state', row)
    if (st) st.textContent = text
    row.classList.toggle('is-done', done)
  }
  const mailOk = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.mail.trim())

  kindList?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.opt-btn')
    if (!btn) return
    kindList.querySelectorAll('.opt-btn').forEach((b) => { b.classList.remove('is-on'); b.setAttribute('aria-checked', 'false') })
    btn.classList.add('is-on'); btn.setAttribute('aria-checked', 'true')
    state.kind = btn.dataset.kind ?? ''
    setRow('kind', state.kind); setText(note, '')
  })

  qs('#when-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn')
    if (!btn) return
    qs('#when-list')!.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('is-on'))
    btn.classList.add('is-on'); state.when = btn.dataset.when ?? ''; setRow('when', state.when)
  })
  qs('#budget-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn')
    if (!btn) return
    qs('#budget-list')!.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('is-on'))
    btn.classList.add('is-on'); state.budget = btn.dataset.budget ?? ''; setRow('budget', state.budget)
  })

  brief?.addEventListener('input', () => {
    state.brief = brief.value.trim()
    const n = state.brief.length
    setText(qs('#brief-count'), n === 0 ? 'NO IDEA TOO UNFINISHED — THAT IS EXACTLY THE POINT.' : `${n} CHARACTERS — KEEP GOING.`)
    setRow('brief', n >= 12 ? 'READ TO START' : 'KEEP WRITING', n >= 12)
    if (n >= 12) setText(note, '')
  })

  const touchContact = () => {
    state.name = nameEl?.value.trim() ?? ''
    state.mail = mailEl?.value.trim() ?? ''
    const ok = state.name.length > 0 && mailOk()
    setRow('contact', ok ? 'READY' : state.name ? 'ADD EMAIL' : 'ADD NAME + EMAIL', ok)
    if (ok) setText(note, '')
  }
  nameEl?.addEventListener('input', touchContact)
  mailEl?.addEventListener('input', touchContact)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const problems: string[] = []
    if (!state.kind) problems.push('01 — WHAT ARE WE MAKING?')
    if (state.brief.length < 12) problems.push('02 — TELL US MORE')
    if (!mailOk()) problems.push('05 — VALID EMAIL')
    if (problems.length) { setText(note, `PIPELINE HOLD — ${problems.join(' · ')}`); return }

    // Try the API endpoint first; fall back to mailto
    try {
      const res = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: state.kind,
          brief: state.brief,
          when: state.when || 'ASAP',
          budget: state.budget || 'TO DISCUSS',
          name: state.name,
          email: state.mail,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setText(note, data.directorNote ?? 'DIRECTOR\'S NOTE RECEIVED — WE\'LL BE IN TOUCH.')
        setRow('kind', 'SENT')
        setRow('brief', 'SENT')
        setRow('contact', 'SENT')
        return
      }
    } catch { /* fall through to mailto */ }

    const subject = `COMMISSION — ${state.kind} — ${state.when || 'ASAP'} — ${state.budget || 'TO DISCUSS'}`
    const body = [
      'NEW PROJECT REQUEST — BAKERY FILMS / AI', '',
      `WHAT: ${state.kind}`, `BRIEF: ${state.brief}`,
      `WHEN: ${state.when || 'ASAP'}`, `BUDGET: ${state.budget || 'TO DISCUSS'}`, '',
      `NAME: ${state.name}`, `EMAIL: ${state.mail}`,
    ].join('\n')
    window.location.href = `mailto:studio@bakeryfilms.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setText(note, 'PIPELINE STARTED — CHECK YOUR MAIL APP.')
  })
}

// ── back to top arrow ──────────────────────────────────────
function initBackToTop() {
  const btn = qs('#back-to-top')
  if (!btn) return
  const THRESHOLD = 600
  let ticking = false

  const check = () => {
    const scrolled = window.scrollY || document.documentElement.scrollTop
    btn.classList.toggle('is-visible', scrolled > THRESHOLD)
    ticking = false
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(check) }
  }, { passive: true })

  btn.addEventListener('click', () => {
    lenis?.scrollTo(0, { duration: 1.6 })
  })
}

// ── theme toggle ────────────────────────────────────────────
function initThemeToggle() {
  const btn = qs('#theme-toggle')
  if (!btn) return
  const root = document.body
  const KEY = 'bakery-theme'

  // restore saved preference
  const saved = localStorage.getItem(KEY)
  if (saved === 'day' || saved === 'night') {
    root.dataset.theme = saved
    document.documentElement.classList.toggle('day', saved === 'day')
  }

  btn.addEventListener('click', () => {
    const current = root.dataset.theme ?? 'night'
    const next = current === 'night' ? 'day' : 'night'
    root.dataset.theme = next
    document.documentElement.classList.toggle('day', next === 'day')
    localStorage.setItem(KEY, next)

    // repaint canvases for the new palette
    paintStaticCanvases()
  })
}

// ── navigation ──────────────────────────────────────────────
function initNav() {
  const menu = qs('#menu-panel')
  const toggle = qs('#nav-toggle')
  const closeMenu = () => {
    menu?.classList.remove('open')
    toggle?.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('locked')
    lenis?.start()
  }
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open') ?? false
    toggle.setAttribute('aria-expanded', String(open))
    document.body.classList.toggle('locked', open)
    if (open) lenis?.stop(); else lenis?.start()
  })
}

// ── key handling ────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (reelOpen) closeReel()
    else if (!caseOverlay?.hidden) void closeCase()
  }
})

// ── page init ───────────────────────────────────────────────
function initPage(container: HTMLElement) {
  // Paint canvases
  paintStaticCanvases()

  if (MOTION) {
    initScroll()
    const route = getCurrentRoute()
    if (route.name === 'home') {
      initSceneOpen()
      playOpeningIntro()
    }
  }

  initGhost()
  initCommission()

  window.setTimeout(() => {
    ScrollTrigger.refresh()
    buildScrubs()
  }, 700)
}

// ── page entrance animations (after wipe opens) ─────────────
function playPageEntrance(route: RouteName) {
  if (!MOTION) return

  switch (route) {
    case 'work': {
      const works = qsa<HTMLElement>('.work')
      if (!works.length) return
      gsap.fromTo(works,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15 }
      )
      break
    }
    case 'capabilities': {
      const mks = qsa<HTMLElement>('.mk')
      if (!mks.length) return
      mks.forEach((mk, i) => {
        gsap.fromTo(mk,
          { opacity: 0, x: i % 2 === 0 ? -30 : 30 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out', delay: 0.1 + i * 0.05 }
        )
      })
      break
    }
    case 'studio': {
      const els = qsa<HTMLElement>('.pe-studio .studio-intro, .pe-studio .disc, .pe-studio .studio-foot')
      if (!els.length) return
      gsap.fromTo(els,
        { opacity: 0, x: 120 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out', stagger: 0.2, delay: 0.1 }
      )
      break
    }
    case 'experiments': {
      const rows = qsa<HTMLElement>('.exp-row')
      if (!rows.length) return
      // stagger rows in
      gsap.fromTo(rows,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, delay: 0.1 }
      )
      // typewrite clip-path on experiment names
      const names = qsa<HTMLElement>('.exp-name')
      if (names.length) {
        gsap.fromTo(names,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power2.inOut', stagger: 0.1, delay: 0.3 }
        )
      }
      break
    }
    case 'contact': {
      const head = qs<HTMLElement>('.pe-contact .scene-head')
      const grid = qs<HTMLElement>('.pe-contact .com-grid')
      if (head) gsap.fromTo(head, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 })
      if (grid) gsap.fromTo(grid, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.25 })
      break
    }
  }
}

// ── boot ────────────────────────────────────────────────────
export async function boot() {
  const app = qs<HTMLElement>('#app')
  if (!app) return

  // Initial render
  const route = getCurrentRoute()
  app.innerHTML = renderPage(route.name)

  initCursor()

  await bootLoader()

  // Initialize router
  initRouter(app)

  // Listen for route changes
  app.addEventListener('page:enter', ((e: CustomEvent) => {
    initPage(e.detail.container)
  }) as EventListener)

  // Wire up navigation events — render page + re-init subsystems on route change
  onNavigate(async (to, container) => {
    container.innerHTML = renderPage(to.name)
    initPage(container)
    // Play page-specific entrance animation after wipe bars open
    if (MOTION) {
      window.setTimeout(() => playPageEntrance(to.name), 200)
    }
  })

  initLenis() // buttery smooth scroll — ONCE, stays alive across routes
  initCase()
  initReel()
  initNav()
  initThemeToggle()
  initBackToTop()
  startScrubLoop()

  window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 60))
}
