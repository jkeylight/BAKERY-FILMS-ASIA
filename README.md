# BAKERY FILMS / AI

> WE MAKE FILMS THAT NEVER HAPPENED.

A cinematic film studio website — routed SPA with page transitions, procedural media engine, and a real commission endpoint.

## Quick Start

```bash
# install
npm install

# dev (opens http://localhost:5173/?motion=1)
npm run dev

# production build
npm run build

# start production server (port 3000)
npm run start

# Windows
start server.bat
```

## Preloader

The loader (`#loader`) is always visible on page load and animates a progress bar + scene counter. It fades out automatically when complete. No `?motion=1` required. The preloader no longer depends on `MOTION` or `prefers-reduced-motion` settings — it always plays. See `SESSIONS.md` for debug history.

## Architecture

### Routes

| Path | Page | Content |
|------|------|---------|
| `/` | Home | Full cinematic experience — opening scroll, capabilities, works, studio, experiments, commission |
| `/capabilities` | What We Make | 11-entry typographic field with ghost previews |
| `/work` | The Work | 5 selected commissions |
| `/studio` | The Studio | Disciplines + editorial paper scene |
| `/experiments` | The Laboratory | Research for films without briefs |
| `/contact` | Commission | Director's note form + pipeline |

All routes use client-side navigation with **Barba-style anamorphic wipe transitions** (the two black bars close → content swaps → bars part).

### Motion System

- **Loader** — always visible on boot, animates progress bar + scene notes, fades out when complete (independent of `MOTION`)
- **Scroll-scrubbed frames** — canvases act as footage: scrolling trucks the camera across over-wide renders
- **Distortion cuts** — image-to-image slice transitions with glitch drops
- **Case transitions** — anamorphic wipe opens the case overlay, CSS-transition hero entrance
- **Loader → intro → pinned scroll sequence** — choreographed opening with timecode

Enable motion for GSAP/Lenis/ScrollTrigger animations: add `?motion=1` to the URL, or it activates by default when `prefers-reduced-motion` is not set.

### Real Media

Drop real assets into `src/content.ts` by filling in the `video` and `poster` fields on each `Work`:

```ts
{
  id: 'city',
  video: { src: '/media/city-film.webm', poster: '/media/city-still.jpg' },
  // poster: '/media/city-still.jpg',  // still-only fallback
  // ...
}
```

When `video` is set, the work renders a `<video>` element. When only `poster` is set, it renders an `<img>`. Both fall back to the procedural canvas engine.

### Commission API

POST `/api/commission` with:

```json
{
  "kind": "FILM",
  "brief": "A world where...",
  "when": "THIS MONTH",
  "budget": "$50-150K",
  "name": "Jane Doe",
  "email": "jane@studio.com"
}
```

Response:

```json
{
  "success": true,
  "id": "0001",
  "directorNote": "Dear Jane,\n\nThank you for bringing..."
}
```

Briefs are stored in `data/briefs.json`. The commission form submits via `fetch()` first; if the server is unavailable, it falls back to `mailto:`.

### Production Server

`npm run start` runs `src/server.ts` (port 3000) which:
- Serves the built SPA from `dist/`
- Handles SPA fallback (any non-asset path serves `index.html`)
- Handles `POST /api/commission`
- Stores briefs in `data/briefs.json`

## File Structure

```
├── SESSIONS.md       # Session log / debug history
├── index.html          # Shell — nav, overlays, #app container
├── src/
│   ├── main.ts         # Entry — imports CSS + boots app
│   ├── app.ts          # Runtime — motion, interaction, subsystems
│   ├── router.ts       # Client-side SPA router with wipe transitions
│   ├── pages.ts        # Per-route content renderers
│   ├── content.ts      # Data model — works, capabilities, experiments
│   ├── paint.ts        # Procedural media engine (deterministic per seed)
│   ├── server.ts       # Production server + commission API
│   └── style.css       # Full design system
├── start server.bat    # Windows quick-start
└── vite.config.ts      # Vite + SPA fallback + API proxy
```

## Palette

Black / off-white / graphite / warm grey + one controlled red (#e23b1e).

## Stack

Vite 8 + TypeScript + GSAP/ScrollTrigger + Lenis
