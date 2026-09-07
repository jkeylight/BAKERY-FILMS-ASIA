# BAKERY FILMS / AI — Session Log

## Session: Preloader Debug — 2026-09-06

### Problem
Preloader not loading on `index.html`. The `#loader` element remained `display: none` and the loader animation never started.

### Root Causes Found & Fixed

1. **CSS: `#loader` hidden by default** (`src/style.css:201`)
   - `#loader { display: none }` + `html.motion #loader { display: flex }` meant the loader only showed when `html.motion` class was present.
   - `html.motion` was only added when `MOTION` was `true`, which required `?motion=1` in URL OR `prefers-reduced-motion` not being set.
   - **Fix**: Changed `#loader` to `display: flex` by default with `position: fixed; inset: 0; z-index: 6000`. Removed `html.motion #loader` dependency. Loader is now always visible unless `.done` class is added.

2. **JS: `bootLoader()` early return on `!MOTION`** (`src/app.ts:178`)
   - `if (!MOTION) return resolve()` caused the loader animation to skip entirely when `MOTION` was `false`.
   - **Fix**: Removed the `if (!MOTION) return resolve()` guard. `bootLoader()` now always runs the animation.

3. **JS: `boot()` hiding loader when `MOTION` is false** (`src/app.ts:839`)
   - `else { loader?.classList.add('done') }` hid the loader with `opacity: 0` when `MOTION` was `false`.
   - **Fix**: Changed to `await bootLoader()` unconditionally — always starts the loader animation.

4. **JS: Error handler hiding loader** (`src/main.ts:7-8`)
   - `loader.classList.add('done')` on boot failure hid the loader.
   - **Fix**: Changed to `loader.classList.remove('done')` and `html.classList.add('motion')` — keeps loader visible on error.

### Files Modified
- `src/style.css` — `#loader` CSS block
- `src/app.ts` — `bootLoader()` function and `boot()` function
- `src/main.ts` — error handler

### Build Command
```bash
npx vite build
```

### Notes
- Vite caches in `node_modules/.vite` — must clear before rebuild to pick up source changes
- Built output has content hashes in filenames (e.g., `index-BGL-yES3.js`) — Vite auto-updates `dist/index.html` references
- `MOTION` variable still controls GSAP/Lenis/ScrollTrigger animations but no longer controls loader visibility

## ⚠️ WARNING — Session: Preloader Polish — 2026-09-06

### Status: ROLLED BACK
This session attempted to improve the `PRE--LOADER.html` visual design (added Archivo font, vignette, decorative line, glow dot, etc.). The changes were rolled back because the design was rejected ("this is ugly" / "match the exact preloader html" → then rolled back again).

### What was changed then reverted:
- `PRE--LOADER.html` — visual overhaul (restored to original)
- `index.html`, `src/style.css`, `src/app.ts` — matched `PRE--LOADER.html` design in `index.html` loader (reverted to original `loader-in`/`loader-l1`/`loader-count`/`loader-bar`/`loader-note` structure)

### Notes
- If continuing design work, start from the current clean state — all preloader code matches the original `loader-in`/`loader-l1`/`loader-count`/`loader-bar`/`loader-note` structure in `index.html`
