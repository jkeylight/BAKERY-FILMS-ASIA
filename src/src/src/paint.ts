// ─────────────────────────────────────────────────────────────
// Procedural "image engine".
// Produces restrained, film-stock stand-in stills until real
// media is dropped into the content model. Deterministic per
// seed: swapping seeds = a new frame, so sets look like frames
// from one continuous shoot.
// ─────────────────────────────────────────────────────────────

import type { Motif } from './content'

export interface PaintOpts {
  seed?: string
  motif?: Motif
  v?: number // variant 0..1 — nudges the same "scene"
  flip?: boolean
}

const NOISE_CACHE: HTMLCanvasElement = (() => {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const g = c.getContext('2d')!
  const img = g.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() * 255) | 0
    img.data[i] = n
    img.data[i + 1] = n
    img.data[i + 2] = n
    img.data[i + 3] = 26
  }
  g.putImageData(img, 0, 0)
  return c
})()

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Pal {
  bgTop: string
  bgBot: string
  tint: string
  tintDim: string
  ink: string
  faint: string
}

// Monochrome + one controlled tint per "film stock".
const PALS: Record<Motif, Pal> = {
  woman: { bgTop: '#15120c', bgBot: '#060504', tint: '#c9b297', tintDim: '#8a7460', ink: '#241d14', faint: '#efe6d6' },
  city: { bgTop: '#101318', bgBot: '#050608', tint: '#d9b36a', tintDim: '#7d6135', ink: '#0c0e12', faint: '#c9d2da' },
  desert: { bgTop: '#2a1c0c', bgBot: '#0a0704', tint: '#e0a44e', tintDim: '#8a5f26', ink: '#1a1006', faint: '#f0d9b0' },
  tokyo: { bgTop: '#120b10', bgBot: '#050404', tint: '#e0433a', tintDim: '#6e1f1c', ink: '#0e070b', faint: '#e8b7ae' },
  hotel: { bgTop: '#14171c', bgBot: '#050608', tint: '#c9a06a', tintDim: '#5d5142', ink: '#0a0d11', faint: '#cdd6de' },
  reel: { bgTop: '#121212', bgBot: '#050505', tint: '#d9c39a', tintDim: '#6b5f49', ink: '#0d0d0d', faint: '#e8e8e2' },
}

function base(g: CanvasRenderingContext2D, w: number, h: number, pal: Pal, v: number) {
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, pal.bgTop)
  grad.addColorStop(1, pal.bgBot)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  // faint horizon glow, nudged by variant
  const gy = h * (0.32 + v * 0.12)
  const glow = g.createRadialGradient(w * 0.5, gy, 0, w * 0.5, gy, w * 0.9)
  glow.addColorStop(0, pal.tintDim)
  glow.addColorStop(1, 'transparent')
  g.fillStyle = glow
  g.globalAlpha = 0.35
  g.fillRect(0, 0, w, h)
  g.globalAlpha = 1
}

function vignette(g: CanvasRenderingContext2D, w: number, h: number) {
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'transparent')
  v.addColorStop(1, 'rgba(0,0,0,0.5)')
  g.fillStyle = v
  g.fillRect(0, 0, w, h)
}

function grain(g: CanvasRenderingContext2D, w: number, h: number) {
  const pat = g.createPattern(NOISE_CACHE, 'repeat')
  if (!pat) return
  g.globalAlpha = 0.5
  g.fillStyle = pat
  g.fillRect(0, 0, w, h)
  g.globalAlpha = 1
}

function letters(g: CanvasRenderingContext2D, w: number, h: number, pal: Pal, rnd: () => number, count: number, amt = 0.06) {
  g.globalAlpha = 0.4
  for (let i = 0; i < count; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const len = 20 + rnd() * 90
    g.strokeStyle = rnd() > 0.5 ? pal.tintDim : pal.faint
    g.lineWidth = 0.5
    g.globalAlpha = amt * (0.3 + rnd())
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + len * (rnd() > 0.5 ? -1 : 1), y + 14)
    g.stroke()
  }
  g.globalAlpha = 1
}

const draw: Record<Motif, (g: CanvasRenderingContext2D, w: number, h: number, pal: Pal, v: number, rnd: () => number) => void> = {
  // Soft drape of light across an unseen figure.
  woman(g, w, h, pal, v, rnd) {
    base(g, w, h, pal, v)
    const cx = w * (0.5 + (v - 0.5) * 0.3)
    const top = g.createRadialGradient(cx, h * 0.2, 0, cx, h * 0.2, w * 0.7)
    top.addColorStop(0, pal.tint)
    top.addColorStop(1, 'transparent')
    g.fillStyle = top
    g.globalAlpha = 0.5
    g.fillRect(0, 0, w, h)
    g.globalAlpha = 1
    g.strokeStyle = pal.ink
    g.fillStyle = pal.ink
    // silhouette curves — a shoulder, a neck, light finding fabric
    for (let i = 0; i < 6; i++) {
      const bw = w * (0.14 + i * 0.05)
      g.globalAlpha = 0.5 + i * 0.06
      g.beginPath()
      g.moveTo(w * (0.18 + i * 0.05), h * 0.3)
      g.bezierCurveTo(w * (0.05 + i * 0.04), h * 0.55, w * (0.5 + i * 0.03), h * 0.62, w * (0.82 + (rnd() - 0.5) * 0.1), h * 0.95)
      g.lineTo(w * (0.98 - i * 0.06), h * 0.95)
      g.lineTo(w * (0.98 - i * 0.06), h * 0.32)
      g.fill()
    }
    g.globalAlpha = 1
    letters(g, w, h, pal, rnd, 22)
    grain(g, w, h)
    vignette(g, w, h)
  },

  // Skyline that no survey recorded.
  city(g, w, h, pal, v, rnd) {
    base(g, w, h, pal, v)
    const horizon = h * (0.5 + v * 0.1)
    // fog band
    const fog = g.createLinearGradient(0, horizon - h * 0.12, 0, horizon + h * 0.1)
    fog.addColorStop(0, 'transparent')
    fog.addColorStop(1, pal.bgTop)
    g.fillStyle = fog
    g.fillRect(0, horizon - h * 0.12, w, h * 0.22)
    // towers
    let x = -0.02 * w
    while (x < w * 1.02) {
      const tw = w * (0.05 + rnd() * 0.09)
      const th = h * (0.25 + rnd() * 0.55)
      const ty = horizon - th + (rnd() - 0.5) * h * 0.06
      g.fillStyle = pal.ink
      g.globalAlpha = 0.9
      g.fillRect(x, ty, tw, horizon - ty)
      // windows — amber sodium, sparse
      const cols = Math.floor(tw / Math.max(4, w * 0.012))
      const rows = Math.floor((horizon - ty) / Math.max(8, h * 0.03))
      g.globalAlpha = 0.8
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++)
          if (rnd() < 0.16) {
            g.fillStyle = rnd() > 0.75 ? pal.tint : pal.tintDim
            g.fillRect(x + 2 + c * (tw / cols), ty + 3 + r * ((horizon - ty) / rows), Math.max(1.5, tw / cols / 2.4), Math.max(2, (horizon - ty) / rows / 2.6))
          }
      x += tw + w * (0.005 + rnd() * 0.03)
    }
    g.globalAlpha = 1
    letters(g, w, h, pal, rnd, 26)
    grain(g, w, h)
    vignette(g, w, h)
  },

  // Dunes that were never surveyed.
  desert(g, w, h, pal, v, rnd) {
    base(g, w, h, pal, v)
    const sunY = h * (0.34 + v * 0.1)
    // sun
    g.fillStyle = pal.tint
    g.globalAlpha = 0.5
    g.beginPath()
    g.arc(w * (0.5 + (v - 0.5) * 0.4), sunY, w * 0.05 + rnd() * w * 0.02, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    // layered dune crests
    let y = h * 0.5
    for (let layer = 0; layer < 5; layer++) {
      g.beginPath()
      g.moveTo(-w * 0.02, h + 4)
      g.lineTo(-w * 0.02, y)
      const segs = 10
      for (let i = 0; i <= segs; i++) {
        const px = (i / segs) * w * 1.04
        const py = y - Math.sin((i / segs) * Math.PI * (1 + rnd() * 0.8 + layer * 0.12)) * h * (0.02 + layer * 0.016)
        g.lineTo(px, py)
      }
      g.lineTo(w * 1.02, h + 4)
      g.closePath()
      const sh = g.createLinearGradient(0, y - h * 0.12, 0, h)
      sh.addColorStop(0, layer % 2 ? pal.ink : pal.tintDim)
      sh.addColorStop(1, pal.bgBot)
      g.fillStyle = sh
      g.globalAlpha = 0.85 - layer * 0.08
      g.fill()
      y += h * (0.045 + rnd() * 0.03)
    }
    g.globalAlpha = 1
    letters(g, w, h, pal, rnd, 18)
    grain(g, w, h)
    vignette(g, w, h)
  },

  // Tokyo, 2096 — a street between two walls of light.
  tokyo(g, w, h, pal, v, rnd) {
    base(g, w, h, pal, v)
    const vpX = w * (0.5 + (v - 0.5) * 0.24)
    const vpY = h * 0.34
    // walls of the street perspective
    for (let side = 0; side < 2; side++) {
      g.fillStyle = pal.ink
      g.beginPath()
      g.moveTo(side ? w : 0, 0)
      g.lineTo(side ? w * 0.62 : w * 0.38, 0)
      g.lineTo(vpX, vpY)
      g.lineTo(side ? w : 0, h)
      g.closePath()
      g.fill()
      // sodium window grids shrinking toward VP
      const levels = 26
      for (let i = 0; i < levels; i++) {
        const t0 = i / levels
        const t1 = (i + 1) / levels
        const x0a = side ? w : 0
        const x0b = side ? w * 0.62 : w * 0.38
        const lerp = (ta: number) => side ? x0b + (x0a - x0b) * ta : x0a + (x0b - x0a) * ta
        const y0 = vpY + (0 - vpY) * t0
        const y1 = vpY + (h - vpY) * t1
        if (rnd() < 0.3) continue
        g.fillStyle = rnd() > 0.8 ? pal.tint : pal.tintDim
        g.globalAlpha = 0.25 + rnd() * 0.6
        // window band
        const cols = 1 + Math.floor(t0 * 8)
        for (let c = 0; c < cols; c++) {
          const c0 = lerp((c + 0.1) / cols)
          const c1 = lerp((c + 0.9) / cols)
          if (c1 - c0 < 1.2) continue
          g.fillRect(c0, y0 + (y1 - y0) * 0.12, Math.max(1, c1 - c0), Math.max(1.4, (y1 - y0) * 0.55))
        }
      }
      g.globalAlpha = 1
    }
    // a red sign cutting across
    g.globalAlpha = 0.7
    g.fillStyle = pal.tint
    const rx = w * (0.14 + rnd() * 0.4)
    g.fillRect(rx, h * (0.42 + rnd() * 0.2), w * (0.16 + rnd() * 0.2), Math.max(3, h * 0.012))
    g.globalAlpha = 1
    letters(g, w, h, pal, rnd, 30, 0.04)
    grain(g, w, h)
    vignette(g, w, h)
  },

  // The last hotel — a facade, a lit door, dawn fog.
  hotel(g, w, h, pal, v, rnd) {
    base(g, w, h, pal, v)
    const facadeW = w * 0.9
    const fx = w * 0.05
    const ft = h * 0.04
    const fb = h * 0.97
    g.fillStyle = pal.ink
    g.fillRect(fx, ft, facadeW, fb - ft)
    // rows of dark windows
    const rows = Math.floor(16 + rnd() * 6)
    const cols = Math.floor(9 + rnd() * 6)
    const rw = facadeW / cols
    const rh = (fb - ft) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = rnd() < 0.12
        g.fillStyle = lit ? (rnd() > 0.5 ? pal.tint : pal.tintDim) : '#000'
        g.globalAlpha = lit ? 0.5 : 0.45
        g.fillRect(fx + c * rw + rw * 0.16, ft + r * rh + rh * 0.16, rw * 0.68, rh * 0.68)
      }
    }
    g.globalAlpha = 1
    // doorway glow
    const dw = facadeW * 0.1
    g.fillStyle = pal.tint
    g.globalAlpha = 0.9
    g.fillRect(fx + facadeW / 2 - dw / 2, fb - h * 0.12, dw, h * 0.12)
    g.globalAlpha = 0.12
    const dg = g.createRadialGradient(fx + facadeW / 2, fb - h * 0.1, 0, fx + facadeW / 2, fb - h * 0.1, w * 0.3)
    dg.addColorStop(0, pal.tint)
    dg.addColorStop(1, 'transparent')
    g.fillStyle = dg
    g.fillRect(0, 0, w, h)
    g.globalAlpha = 1
    letters(g, w, h, pal, rnd, 20)
    grain(g, w, h)
    vignette(g, w, h)
  },

  // Generic cut — used by the reel engine.
  reel(g, w, h, pal, v, rnd) {
    const pick = [PALS.city, PALS.hotel, PALS.woman, PALS.desert, PALS.tokyo]
    const p = pick[Math.floor(rnd() * pick.length)]
    draw[Math.floor(rnd() * 3) === 0 ? 'hotel' : 'city'](g, w, h, p, v, rnd)
  },
}

function sizeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width * dpr))
  const h = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const g = canvas.getContext('2d')!
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, w, h)
  return g
}

/** Render a standalone frame at exact pixel size — used by the
 *  scroll-scrub camera (over-wide base frames) and frame sequences. */
export function renderFrame(w: number, h: number, opts: PaintOpts): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const g = c.getContext('2d')!
  const seed = opts.seed ?? 'frame'
  const motif: Motif = opts.motif ?? 'reel'
  const v = opts.v ?? 0
  const rnd = mulberry32(hash(`${seed}::${motif}::${v.toFixed(3)}`))
  g.save()
  if (opts.flip) {
    g.translate(c.width, 0)
    g.scale(-1, 1)
  }
  draw[motif](g, c.width, c.height, PALS[motif], v, rnd)
  g.restore()
  return c
}

export function paintCanvas(canvas: HTMLCanvasElement, opts: PaintOpts) {
  if (!canvas || canvas.width === 0) return
  const g = sizeCanvas(canvas)
  const w = canvas.width
  const h = canvas.height
  const seed = opts.seed ?? 'frame'
  const motif: Motif = opts.motif ?? 'reel'
  const v = opts.v ?? 0
  const rnd = mulberry32(hash(`${seed}::${motif}::${v.toFixed(3)}`))
  const pal = PALS[motif]
  g.save()
  if (opts.flip) {
    g.translate(w, 0)
    g.scale(-1, 1)
  }
  draw[motif](g, w, h, pal, v, rnd)
  g.restore()
  // thin film edge marker
  g.strokeStyle = 'rgba(255,255,255,0.06)'
  g.lineWidth = 1
  g.strokeRect(0.5, 0.5, w - 1, h - 1)
}

// ── Ghost / hover previews (ACT II) — composite modes ────────
export type GhostMode = 'strip' | 'cinema' | 'grid' | 'still' | 'beat'

function scratchFrame(seed: string, motif: Motif, v: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 240
  c.height = 150
  const g = c.getContext('2d')!
  const rnd = mulberry32(hash(`${seed}::${motif}::${v.toFixed(3)}`))
  const pal = PALS[motif]
  draw[motif](g, 240, 150, pal, v, rnd)
  return c
}

export function paintGhost(canvas: HTMLCanvasElement, seed: string, mode: GhostMode) {
  if (!canvas) return
  const g = sizeCanvas(canvas)
  const w = canvas.width
  const h = canvas.height
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)

  const motifs: Motif[] = ['city', 'hotel', 'woman', 'tokyo', 'desert']
  const motifAt = (i: number) => motifs[i % motifs.length]

  const drawCell = (x: number, y: number, cw: number, ch: number, motif: Motif, v: number) => {
    g.save()
    g.beginPath()
    g.rect(x, y, cw, ch)
    g.clip()
    const cell = scratchFrame(seed + String(x) + String(y), motif, v)
    g.imageSmoothingEnabled = true
    g.drawImage(cell, x, y, cw, ch)
    g.restore()
  }

  const rnd = mulberry32(hash(seed + mode))

  switch (mode) {
    case 'strip': {
      const n = 6
      const gap = w * 0.01
      const cw = (w - gap * (n - 1)) / n
      for (let i = 0; i < n; i++) {
        drawCell(i * (cw + gap), 0, cw, h, motifAt(i + 1), rnd())
      }
      break
    }
    case 'grid': {
      const x = w / 2
      const y = h / 2
      drawCell(0, 0, x, y, motifAt(0), rnd())
      drawCell(x, 0, x, y, motifAt(1), rnd())
      drawCell(0, y, x, y, motifAt(2), rnd())
      drawCell(x, y, x, y, motifAt(3), rnd())
      break
    }
    case 'still': {
      drawCell(0, 0, w, h, motifAt(2), rnd())
      break
    }
    case 'cinema': {
      const bar = h * 0.09
      g.fillStyle = '#000'
      g.fillRect(0, 0, w, bar)
      g.fillRect(0, h - bar, w, bar)
      drawCell(0, bar, w, h - bar * 2, motifAt(1), rnd())
      break
    }
    case 'beat': {
      drawCell(0, 0, w, h, motifAt(3), rnd())
      g.fillStyle = 'rgba(0,0,0,0.62)'
      g.fillRect(0, 0, w, h)
      const n = 26
      const bw = w / n
      for (let i = 0; i < n; i++) {
        const bh = h * (0.1 + rnd() * 0.82)
        const bx = i * bw + bw * 0.14
        g.fillStyle = i % 5 === 0 ? PALS.tokyo.tint : PALS.tokyo.tintDim
        g.globalAlpha = 0.9
        g.fillRect(bx, h - bh, bw * 0.72, bh)
      }
      g.globalAlpha = 1
      break
    }
  }
  g.strokeStyle = 'rgba(255,255,255,0.05)'
  g.lineWidth = 1
  g.strokeRect(0.5, 0.5, w - 1, h - 1)
}
