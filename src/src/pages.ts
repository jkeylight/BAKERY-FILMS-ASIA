// ─────────────────────────────────────────────────────────────
// BAKERY FILMS / AI — page renderers
// Each route renders its content into the shared container.
// ─────────────────────────────────────────────────────────────

import type { RouteName } from './router'
import {
  DISCIPLINES, EXPERIMENTS, MAKES, ORDER_BUDGET, ORDER_KINDS, ORDER_WHEN,
  REEL_WORDS, WORKS, type Motif, type Work,
} from './content'

function escapeHtml(s: string): string {
  return s.replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"' : '&quot;' })[c]!)
}

const fmt = (n: number) => String(n).padStart(2, '0')

// ── Shared fragments ────────────────────────────────────────
function sectionHead(act: string, title: string, note?: string, accent = true): string {
  return `<header class="scene-head" data-reveal>
    <p class="meta${accent ? ' accent' : ''}">${escapeHtml(act)}</p>
    <h2 class="h-giant">${title}<em class="blink">.</em></h2>
    ${note ? `<p class="scene-head-note">${escapeHtml(note)}</p>` : ''}
  </header>`
}

function makeRow(m: { name: string; cap: string; mode: string; outline?: boolean }, i: number): string {
  return `<div class="mk ${m.outline ? 'o' : ''}" data-mode="${m.mode}" data-seed="make-${i}" data-name="${escapeHtml(m.name)}" data-cap="${escapeHtml(m.cap)}">
    <span class="mk-idx">${fmt(i + 1)}</span>
    <h3 class="mk-name">${escapeHtml(m.name)}</h3>
    <span class="mk-cap">${escapeHtml(m.cap)}</span>
  </div>`
}

function workItem(w: Work, i: number): string {
  const frames = (cls: string, extra: string) => {
    const v = (i * 37 + 13) % 100 / 100
    // If the work has a poster image, show that; if it has video, show a video element
    if (w.poster) {
      return `<figure class="w-frame ${cls}" data-reveal>
        <img class="w-img" src="${escapeHtml(w.poster)}" alt="${escapeHtml(w.titleLines.map(l => l.t).join(' '))}" loading="lazy" />
        <figcaption class="w-cap">${escapeHtml(w.cat)} — FRAME ${w.no}</figcaption>
        <span class="w-code">BFW-${w.no}${extra}</span>
      </figure>`
    }
    if (w.video) {
      return `<figure class="w-frame ${cls}" data-reveal>
        <video class="w-video" src="${escapeHtml(w.video.src)}" ${w.video.poster ? `poster="${escapeHtml(w.video.poster)}"` : ''} muted loop preload="metadata" playsinline></video>
        <canvas class="w-canvas" data-seed="w-${w.id}${cls}" data-motif="${w.motif}" data-v="${v.toFixed(2)}"></canvas>
        <figcaption class="w-cap">PROJECTED STILL — FRAME ${w.no}</figcaption>
        <span class="w-code">BFW-${w.no}${extra}</span>
      </figure>`
    }
    return `<figure class="w-frame ${cls}" data-reveal>
      <canvas class="w-canvas" data-seed="w-${w.id}${cls}" data-motif="${w.motif}" data-v="${v.toFixed(2)}"></canvas>
      <figcaption class="w-cap">PROJECTED STILL — FRAME ${w.no}</figcaption>
      <span class="w-code">BFW-${w.no}${extra}</span>
    </figure>`
  }

  const title = `<div class="w-ttl" data-reveal>${w.titleLines
    .map((l) => `<span class="w-l ${l.major ? 'w-l-major' : ''}">${escapeHtml(l.t)}</span>`)
    .join('')}</div>`
  const body = `<div class="w-body">
    <div class="w-meta"><p class="meta accent">${escapeHtml(w.cat)}</p><span class="meta">${w.runtime} — ${w.year}</span></div>
    ${title}
    <p class="w-lede">${escapeHtml(w.lede)}</p>
    <span class="w-open">OPEN CASE <span class="w-arrow">↗</span></span>
  </div>`

  switch (w.variant) {
    case 'b':
      return `<a class="work w--b" href="#" data-work="${w.id}" data-reveal>${frames('', '')}${body}</a>`
    case 'c':
      return `<a class="work w--c" href="#" data-work="${w.id}" data-reveal>${frames('w-frame-a', '-A')}${frames('w-frame-b', '-B')}${body}</a>`
    case 'd': {
      const side = `<div class="w-side">
        <div class="w-score"><span>MIDNIGHT</span><span class="meta">/</span><span>TOKYO</span><span class="meta">/</span><span>2096</span></div>
        <p class="meta">TWO MINUTES AND ELEVEN SECONDS OF A NIGHT THAT NEVER HAPPENED.</p>
        <p class="meta">SYNC — CUT TO TRACK. EVERY FRAME DRAWN.</p>
      </div>`
      const bodyD = `<div class="w-body">
        ${title}
        <p class="w-line">FORMAT — ${w.format}<br />DIRECTOR'S NOTE — ${escapeHtml(w.lede)}</p>
        <span class="w-open">OPEN CASE <span class="w-arrow">↗</span></span>
      </div>`
      return `<a class="work w--d" href="#" data-work="${w.id}" data-reveal>${side}${frames('', '')}${bodyD}</a>`
    }
    case 'e':
      return `<a class="work w--e" href="#" data-work="${w.id}" data-reveal>${frames('', '')}${body}</a>`
    default:
      return `<a class="work w--a" href="#" data-work="${w.id}" data-reveal>${frames('', '')}${body}</a>`
  }
}

// ── Page: HOME ──────────────────────────────────────────────
function renderHome(): string {
  return `
    <!-- ACT I — THE IMPOSSIBLE -->
    <section class="act-drive" id="act-drive" aria-label="Opening">
      <div class="scene act-open" id="scene-open">
      <canvas id="open-bg" class="open-bg" aria-hidden="true"></canvas>
      <div class="cine-top" aria-hidden="true">
        <span class="meta">BAKERY FILMS ASIA PRESENTS</span>
        <span class="meta">SCENE 001 — NIGHT</span>
      </div>
      <div class="cine-bottom" aria-hidden="true">
        <span class="meta">35&nbsp;MM · COLOR · 2.39&nbsp;:&nbsp;1</span>
        <span class="meta" id="cine-roll">ROLL 042 — IN CAMERA</span>
      </div>

      <div class="open-stage">
        <p class="open-tc" id="open-tc">00:00:00</p>
        <h1 class="open-lines" aria-label="We make films that never happened.">
          <span class="ol"><span class="ol-i">WE&nbsp;MAKE</span></span>
          <span class="ol ol-major"><span class="ol-i">FILMS</span></span>
          <span class="ol"><span class="ol-i">THAT&nbsp;NEVER</span></span>
          <span class="ol ol-major ol-last"><span class="ol-i">HAPPENED<em class="blink">.</em></span></span>
        </h1>
        <p class="open-sub meta" id="open-sub">ALL CREATED IN WORLDS THAT DON'T EXIST.</p>
      </div>

      <div class="cut-stage" id="cut-stage" aria-hidden="true">
        <p class="cut-word" id="cut-word">FILM</p>
      </div>

      <div class="open-frags" aria-hidden="true">
        <figure class="frag frag-1"><img class="frag-img" src="/assets/images/home/hm-01-header-left-woman-a.webp.png" alt="Fashion figure in synthetic fabric." /><figcaption class="meta">FILM — UNFINISHED CUT</figcaption></figure>
        <figure class="frag frag-2"><img class="frag-img" src="/assets/images/home/hm-02-header-right-city-a.webp.jpg" alt="A city that does not exist." /><figcaption class="meta">COMMERCIAL — SET 00</figcaption></figure>
        <figure class="frag frag-3"><img class="frag-img" src="/assets/images/home/hm-03-header-lower-tokyo-a.webp.jpg" alt="A night scene from Tokyo 2096." /><figcaption class="meta">IMAGE — TAKEN, NOT FOUND</figcaption></figure>
      </div>
      </div>
    </section>

    <!-- ACT II — WHAT WE MAKE -->
    <section class="scene act-cap" id="capabilities" aria-label="Capabilities">
      ${sectionHead('ACT 02 — CAPABILITIES', 'WHAT<br />WE MAKE', 'ELEVEN WAYS TO MAKE THE IMPOSSIBLE.<br />HOVER THE FIELD — EACH NAME REACTS DIFFERENTLY.')}
      <div class="mk-field" id="make-field">
        ${MAKES.map((m, i) => makeRow(m, i)).join('')}
      </div>
      <div class="ghost" id="ghost" aria-hidden="true">
        <canvas id="ghost-canvas"></canvas>
        <span class="ghost-tag meta" id="ghost-tag"></span>
      </div>
      <footer class="act-cap-foot" data-reveal>
        <p class="meta">EVERY FRAME BELOW WAS MADE — NEVER FOUND.</p>
        <span class="mono">↓</span>
      </footer>
    </section>

    <!-- ACT III — THE WORK -->
    <section class="scene act-work" id="work" aria-label="The work">
      ${sectionHead('ACT 03 — THE WORK', 'SELECTED<br />COMMISSIONS', 'FIVE PROJECTS FROM WORLDS THAT NEVER EXISTED.<br />CLICK A FILM TO ENTER ITS CASE.')}
      <div class="work-list" id="work-list" data-reveal>
        ${WORKS.map((w, i) => workItem(w, i)).join('')}
      </div>
    </section>

    <!-- EDIT BEAT -->
    <section class="scene act-edit" id="edit" aria-label="Production method">
      <div class="edit-strip" data-reveal>
        <span class="edit-beat meta">IDEA</span><i class="edit-arrow">→</i>
        <span class="edit-beat meta">IMAGE</span><i class="edit-arrow">→</i>
        <span class="edit-beat meta">MOTION</span><i class="edit-arrow">→</i>
        <span class="edit-beat meta accent">FILM</span>
      </div>
      <p class="meta edit-note" data-reveal>PRODUCTION, WITHOUT A LOCATION. THE SCROLL IS THE EDIT.</p>
    </section>

    <!-- ACT IV — THE STUDIO -->
    <section class="scene act-studio" id="studio" aria-label="The studio" data-theme-scene="day">
      <header class="studio-intro">
        <p class="meta ink-muted" data-reveal>ACT 04 — THE STUDIO</p>
        <h2 class="h-giant h-giant--ink" data-reveal>WE ARE<br />A FILM<br />STUDIO<em class="blink">.</em></h2>
        <p class="studio-lede" data-reveal>We use artificial intelligence as a <em>production medium</em> — not as a substitute for ideas. Every image is directed, art-directed, selected and finished by people. The machine is our camera.</p>
      </header>
      <div class="disc" id="disc-list" data-reveal>
        ${DISCIPLINES.map((d, i) => `<div class="disc-row">
          <span class="disc-no">${fmt(i + 1)}/${fmt(DISCIPLINES.length)}</span>
          <span class="disc-name">${escapeHtml(d.name)}</span>
          <span class="disc-flow">${d.flow.map((f, j) => (j ? `<i>→</i>${escapeHtml(f)}` : escapeHtml(f))).join('')}</span>
        </div>`).join('')}
      </div>
      <footer class="studio-foot">
        <p class="meta ink-muted" data-reveal>FOUNDED ON ONE RULE — AN IMAGE IS NOT MADE BY A MACHINE. IT IS MADE BY A DECISION.</p>
      </footer>
    </section>

    <!-- EXPERIMENTS -->
    <section class="scene act-exp" id="experiments" aria-label="Experiments">
      ${sectionHead('ACT 05 — EXPERIMENTS', 'THE<br />LABORATORY', 'NOT CLIENT WORK. RESEARCH FOR FILMS<br />THAT DON\'T HAVE A BRIEF YET.')}
      <ol class="exp-list" id="exp-list">
        ${EXPERIMENTS.map((e, i) => `<li class="exp-row" data-seed="exp-${i}" data-reveal>
          <span class="exp-no">${fmt(i + 1)}</span>
          <span class="exp-name">${escapeHtml(e.title)}</span>
          <span class="exp-right"><span class="exp-desc">${escapeHtml(e.desc)}</span><span class="exp-tag">${escapeHtml(e.tag)}</span></span>
        </li>`).join('')}
      </ol>
      <p class="exp-note meta" data-reveal>THE LAB IS ALWAYS IN PROGRESS. THAT IS THE POINT.</p>
    </section>

    <!-- ACT V — COMMISSION -->
    <section class="scene act-com" id="contact" aria-label="Commission">
      ${sectionHead('ACT 06 — HAVE AN IDEA?', 'LET\'S<br />MAKE<br />IT', undefined, false)}
      <div class="com-grid">
        <form class="order" id="order-form" novalidate>
          <fieldset class="of" id="of-kind">
            <legend class="meta"><em>01</em> — WHAT ARE WE MAKING?</legend>
            <div class="opt-list" id="kind-list">
              ${ORDER_KINDS.map((k) => `<button type="button" class="opt-btn" data-kind="${escapeHtml(k)}" role="radio" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>${escapeHtml(k)}</span></button>`).join('')}
            </div>
          </fieldset>
          <fieldset class="of of--brief">
            <legend class="meta"><em>02</em> — TELL US ABOUT IT</legend>
            <label class="sr-only" for="brief-txt">Tell us about the project</label>
            <textarea id="brief-txt" name="brief" rows="4" placeholder="Describe the world you want to see…"></textarea>
            <p class="meta field-hint" id="brief-count">NO IDEA TOO UNFINISHED — THAT IS EXACTLY THE POINT.</p>
          </fieldset>
          <div class="of-row">
            <fieldset class="of">
              <legend class="meta"><em>03</em> — WHEN?</legend>
              <div class="seg" id="when-list">
                ${ORDER_WHEN.map((w) => `<button type="button" class="seg-btn" data-when="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join('')}
              </div>
            </fieldset>
            <fieldset class="of">
              <legend class="meta"><em>04</em> — BUDGET</legend>
              <div class="seg" id="budget-list">
                ${ORDER_BUDGET.map((b) => `<button type="button" class="seg-btn" data-budget="${escapeHtml(b)}">${escapeHtml(b)}</button>`).join('')}
              </div>
            </fieldset>
          </div>
          <fieldset class="of of--contact">
            <legend class="meta"><em>05</em> — CONTACT</legend>
            <div class="contact-row">
              <label class="f-inline">
                <span class="meta">NAME</span>
                <input id="client-name" name="name" type="text" autocomplete="name" placeholder="Your name" />
              </label>
              <label class="f-inline">
                <span class="meta">EMAIL</span>
                <input id="client-mail" name="mail" type="email" autocomplete="email" placeholder="you@studio.com" />
              </label>
            </div>
          </fieldset>
          <div class="order-actions">
            <p class="meta form-note" id="form-note" role="alert"></p>
            <button class="send" id="send-btn" type="submit" data-cursor="SEND ↗">SEND THE IDEA <span class="send-arrow">↗</span></button>
            <p class="meta mail-note">OR WRITE TO <a href="mailto:studio@bakeryfilms.ai">STUDIO@BAKERYFILMS.AI</a></p>
          </div>
        </form>
        <aside class="pipeline" aria-label="Production pipeline status">
          <p class="meta ink-muted">PRODUCTION PIPELINE</p>
          <ul id="pipeline">
            <li data-step="kind"><span class="p-no">01</span><span class="p-name">MAKING</span><span class="p-state meta">PENDING</span></li>
            <li data-step="brief"><span class="p-no">02</span><span class="p-name">BRIEF</span><span class="p-state meta">PENDING</span></li>
            <li data-step="when"><span class="p-no">03</span><span class="p-name">SCHEDULE</span><span class="p-state meta">—</span></li>
            <li data-step="budget"><span class="p-no">04</span><span class="p-name">BUDGET</span><span class="p-state meta">—</span></li>
            <li data-step="contact"><span class="p-no">05</span><span class="p-name">RETURN</span><span class="p-state meta">PENDING</span></li>
          </ul>
          <p class="pipeline-foot meta">WE REPLY WITH A DIRECTOR'S NOTE, NOT A QUOTE.</p>
        </aside>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">THE END<em class="blink">.</em> — FILM REWOUND FOR THE NEXT VIEWER.</p>
        <button class="back-top" id="back-top" data-route="/" data-cursor="REWIND">REWIND ↑</button>
      </div>
      <div class="finale-grid">
        <div class="fg-main">
          <p class="fg-word">BAKERY FILMS ASIA</p>
          <p class="meta fg-line">A FILM STUDIO FOR IMAGES THAT DIDN'T EXIST.</p>
        </div>
        <nav class="fg-col" aria-label="Footer index">
          <p class="meta ink-muted">INDEX</p>
          <a href="/studio" target="_blank" rel="noreferrer">STUDIO</a>
          <a href="/work" target="_blank" rel="noreferrer">WORK</a>
          <a href="/capabilities" target="_blank" rel="noreferrer">CAPABILITIES</a>
          <a href="/experiments" target="_blank" rel="noreferrer">EXPERIMENTS</a>
          <a href="/contact" target="_blank" rel="noreferrer">COMMISSION</a>
        </nav>
        <div class="fg-col">
          <p class="meta ink-muted">NEW BUSINESS</p>
          <a href="mailto:studio@bakeryfilms.ai">STUDIO@BAKERYFILMS.AI</a>
          <p class="meta fg-sub">IG — @BAKERYFILMS</p>
          <p class="meta fg-sub">CITY — ANYWHERE, RENDERED</p>
        </div>
        <p class="fg-legal meta">© 2026 BAKERY FILMS ASIA / AI.<br />NO ACTORS, SETS OR LOCATIONS<br />WERE HARMED — OR EVER EXISTED.</p>
      </div>
    </footer>
  `
}

// ── Page: WORK ──────────────────────────────────────────────
function renderWork(): string {
  return `
    <section class="work-ledger page-view pe-work" id="work" aria-label="The work">
      <header class="work-ledger-head">
        <div class="work-ledger-top">
          <p class="meta accent">WORK / FILM LEDGER</p>
          <p class="meta">05 COMMISSIONS / 00 LOCATIONS</p>
        </div>
        <div class="work-ledger-title">
          <p class="work-ledger-index">02</p>
          <h1>THE<br /><span>WORK</span><i>.</i></h1>
          <p class="work-ledger-lede">A record of images that arrived without a set, a cast or a street to stand on. Each commission is a world built to hold one precise idea.</p>
        </div>
        <p class="work-ledger-rule">THE PROOF IS NOT THE PRODUCTION.<br /><b>THE PROOF IS THE FRAME.</b></p>
      </header>

      <nav class="work-index" aria-label="Work index">
        <p class="meta">INDEX / JUMP TO A WORLD</p>
        <div class="work-index-list">
          ${WORKS.map((w, i) => `<a href="#work-${w.id}"><span>${fmt(i + 1)}</span><strong>${escapeHtml(w.titleLines.map((line) => line.t).join(' '))}</strong><em>${escapeHtml(w.cat)}</em></a>`).join('')}
        </div>
      </nav>

      <div class="work-ledger-list" id="work-list">
        ${WORKS.map((w, i) => `<div id="work-${w.id}" class="work-ledger-entry">${workItem(w, i)}</div>`).join('')}
      </div>
      <footer class="work-ledger-foot">
        <p class="meta">EVERY WORLD HAS A CUT.</p>
        <a class="work-next" href="/contact" target="_blank" rel="noreferrer">COMMISSION THE NEXT ONE <b>↗</b></a>
      </footer>
    </section>
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">END OF REEL<em class="blink">.</em></p>
        <a class="back-top" href="/" data-route="/" data-cursor="REWIND">REWIND ↑</a>
      </div>
    </footer>
  `
}

// ── Page: STUDIO ────────────────────────────────────────────
function renderStudio(): string {
  return `
    <section class="scene act-studio page-view pe-studio" id="studio" aria-label="The studio" data-theme-scene="day">
      <header class="studio-intro">
        <p class="meta ink-muted" data-reveal>ACT 04 — THE STUDIO</p>
        <h2 class="h-giant h-giant--ink" data-reveal>WE ARE<br />A FILM<br />STUDIO<em class="blink">.</em></h2>
        <p class="studio-lede" data-reveal>We use artificial intelligence as a <em>production medium</em> — not as a substitute for ideas. Every image is directed, art-directed, selected and finished by people. The machine is our camera.</p>
      </header>
      <div class="disc" id="disc-list" data-reveal>
        ${DISCIPLINES.map((d, i) => `<div class="disc-row" data-reveal>
          <span class="disc-no">${fmt(i + 1)}/${fmt(DISCIPLINES.length)}</span>
          <span class="disc-name">${escapeHtml(d.name)}</span>
          <span class="disc-flow">${d.flow.map((f, j) => (j ? `<i>→</i>${escapeHtml(f)}` : escapeHtml(f))).join('')}</span>
        </div>`).join('')}
      </div>
      <footer class="studio-foot">
        <p class="meta ink-muted" data-reveal>FOUNDED ON ONE RULE — AN IMAGE IS NOT MADE BY A MACHINE. IT IS MADE BY A DECISION.</p>
      </footer>
    </section>
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">END OF REEL<em class="blink">.</em></p>
        <a class="back-top" href="/" data-route="/" data-cursor="REWIND">REWIND ↑</a>
      </div>
    </footer>
  `
}

// ── Page: CAPABILITIES ──────────────────────────────────────
function renderCapabilities(): string {
  return `
    <section class="cap-atlas page-view pe-cap" id="capabilities" aria-label="Capabilities">
      <header class="cap-atlas-intro">
        <div class="cap-kicker">
          <p class="meta accent">CAPABILITIES / PRODUCTION ATLAS</p>
          <p class="meta">A FIELD GUIDE TO MAKING WHAT CANNOT BE SHOT</p>
        </div>
        <div class="cap-manifesto">
          <p class="cap-index">01</p>
          <h1>THE<br /><span>WORLD</span><br />IS THE<br /><i>MEDIUM.</i></h1>
          <p class="cap-intro-copy">We do not begin with a camera, a location or a production schedule. We begin with the image that has no physical way to exist, then build the conditions for it to feel inevitable.</p>
        </div>
        <div class="cap-stamp" aria-label="Production note"><span>BF / AI</span><b>NO LOCATION<br />REQUIRED</b><span>ROLL 02 — 2026</span></div>
      </header>

      <section class="cap-atlas-field" aria-labelledby="cap-field-title">
        <div class="cap-field-head">
          <p class="meta">SCENE 02 / THE FIELD</p>
          <h2 id="cap-field-title">EVERY<br /><em>FORMAT</em><br />IS A DOOR.</h2>
          <p class="cap-field-note">Choose the form first. The world follows. Hover a line to pull its image out of the wall.</p>
        </div>
        <div class="mk-field" id="make-field">
          ${MAKES.map((m, i) => makeRow(m, i)).join('')}
        </div>
        <div class="ghost" id="ghost" aria-hidden="true">
          <canvas id="ghost-canvas"></canvas>
          <span class="ghost-tag meta" id="ghost-tag"></span>
        </div>
      </section>

      <section class="cap-process" aria-label="How a possibility enters production">
        <div class="cap-process-lead">
          <p class="meta accent">SCENE 03 / THE TRANSLATION</p>
          <h2>FROM<br />IMPOSSIBLE<br /><span>TO FRAME.</span></h2>
          <p>One idea can become a film, a still, a campaign or an entire visual language. The medium changes. The point of view does not.</p>
        </div>
        <ol class="cap-process-list">
          <li><span>01</span><strong>INVENT</strong><p>Find the image hiding behind the brief.</p></li>
          <li><span>02</span><strong>DIRECT</strong><p>Give the world a point of view, light and gravity.</p></li>
          <li><span>03</span><strong>BUILD</strong><p>Generate, select and refine until the fiction holds.</p></li>
          <li><span>04</span><strong>DELIVER</strong><p>Finish the frame for every screen, cut and surface.</p></li>
        </ol>
      </section>

      <footer class="cap-atlas-foot">
        <p class="meta">THE FRAME IS THE EVIDENCE.</p>
        <a class="cap-next" href="/work" target="_blank" rel="noreferrer"><span>CONTINUE TO THE WORK</span><b>↗</b></a>
      </footer>
    </section>
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">END OF REEL<em class="blink">.</em></p>
        <a class="back-top" href="/" data-route="/" data-cursor="REWIND">REWIND ↑</a>
      </div>
    </footer>
  `
}

// ── Page: EXPERIMENTS ───────────────────────────────────────
function renderExperiments(): string {
  return `
    <section class="scene act-exp page-view pe-exp" id="experiments" aria-label="Experiments">
      ${sectionHead('ACT 03 — EXPERIMENTS', 'THE<br />LABORATORY', 'NOT CLIENT WORK. RESEARCH FOR FILMS<br />THAT DON\'T HAVE A BRIEF YET.')}
      <ol class="exp-list" id="exp-list">
        ${EXPERIMENTS.map((e, i) => `<li class="exp-row" data-seed="exp-${i}" data-reveal>
          <span class="exp-no">${fmt(i + 1)}</span>
          <span class="exp-name">${escapeHtml(e.title)}</span>
          <span class="exp-right"><span class="exp-desc">${escapeHtml(e.desc)}</span><span class="exp-tag">${escapeHtml(e.tag)}</span></span>
        </li>`).join('')}
      </ol>
      <p class="exp-note meta" data-reveal>THE LAB IS ALWAYS IN PROGRESS. THAT IS THE POINT.</p>
    </section>
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">END OF REEL<em class="blink">.</em></p>
        <a class="back-top" href="/" data-route="/" data-cursor="REWIND">REWIND ↑</a>
      </div>
    </footer>
  `
}

// ── Page: CONTACT ───────────────────────────────────────────
function renderContact(): string {
  return `
    <section class="scene act-com page-view pe-contact" id="contact" aria-label="Commission">
      ${sectionHead('ACT 04 — HAVE AN IDEA?', 'LET\'S<br />MAKE<br />IT', undefined, false)}
      <div class="com-grid">
        <form class="order" id="order-form" novalidate>
          <fieldset class="of" id="of-kind">
            <legend class="meta"><em>01</em> — WHAT ARE WE MAKING?</legend>
            <div class="opt-list" id="kind-list">
              ${ORDER_KINDS.map((k) => `<button type="button" class="opt-btn" data-kind="${escapeHtml(k)}" role="radio" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>${escapeHtml(k)}</span></button>`).join('')}
            </div>
          </fieldset>
          <fieldset class="of of--brief">
            <legend class="meta"><em>02</em> — TELL US ABOUT IT</legend>
            <label class="sr-only" for="brief-txt">Tell us about the project</label>
            <textarea id="brief-txt" name="brief" rows="4" placeholder="Describe the world you want to see…"></textarea>
            <p class="meta field-hint" id="brief-count">NO IDEA TOO UNFINISHED — THAT IS EXACTLY THE POINT.</p>
          </fieldset>
          <div class="of-row">
            <fieldset class="of">
              <legend class="meta"><em>03</em> — WHEN?</legend>
              <div class="seg" id="when-list">
                ${ORDER_WHEN.map((w) => `<button type="button" class="seg-btn" data-when="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join('')}
              </div>
            </fieldset>
            <fieldset class="of">
              <legend class="meta"><em>04</em> — BUDGET</legend>
              <div class="seg" id="budget-list">
                ${ORDER_BUDGET.map((b) => `<button type="button" class="seg-btn" data-budget="${escapeHtml(b)}">${escapeHtml(b)}</button>`).join('')}
              </div>
            </fieldset>
          </div>
          <fieldset class="of of--contact">
            <legend class="meta"><em>05</em> — CONTACT</legend>
            <div class="contact-row">
              <label class="f-inline">
                <span class="meta">NAME</span>
                <input id="client-name" name="name" type="text" autocomplete="name" placeholder="Your name" />
              </label>
              <label class="f-inline">
                <span class="meta">EMAIL</span>
                <input id="client-mail" name="mail" type="email" autocomplete="email" placeholder="you@studio.com" />
              </label>
            </div>
          </fieldset>
          <div class="order-actions">
            <p class="meta form-note" id="form-note" role="alert"></p>
            <button class="send" id="send-btn" type="submit" data-cursor="SEND ↗">SEND THE IDEA <span class="send-arrow">↗</span></button>
            <p class="meta mail-note">OR WRITE TO <a href="mailto:studio@bakeryfilms.ai">STUDIO@BAKERYFILMS.AI</a></p>
          </div>
        </form>
        <aside class="pipeline" aria-label="Production pipeline status">
          <p class="meta ink-muted">PRODUCTION PIPELINE</p>
          <ul id="pipeline">
            <li data-step="kind"><span class="p-no">01</span><span class="p-name">MAKING</span><span class="p-state meta">PENDING</span></li>
            <li data-step="brief"><span class="p-no">02</span><span class="p-name">BRIEF</span><span class="p-state meta">PENDING</span></li>
            <li data-step="when"><span class="p-no">03</span><span class="p-name">SCHEDULE</span><span class="p-state meta">—</span></li>
            <li data-step="budget"><span class="p-no">04</span><span class="p-name">BUDGET</span><span class="p-state meta">—</span></li>
            <li data-step="contact"><span class="p-no">05</span><span class="p-name">RETURN</span><span class="p-state meta">PENDING</span></li>
          </ul>
          <p class="pipeline-foot meta">WE REPLY WITH A DIRECTOR'S NOTE, NOT A QUOTE.</p>
        </aside>
      </div>
    </section>
    <footer class="finale" aria-label="Footer">
      <div class="finale-meta">
        <p class="meta">END OF REEL<em class="blink">.</em></p>
        <a class="back-top" href="/" data-route="/" data-cursor="REWIND">REWIND ↑</a>
      </div>
    </footer>
  `
}

// ── Dispatch ────────────────────────────────────────────────
const renderers: Record<RouteName, () => string> = {
  home: renderHome,
  work: renderWork,
  studio: renderStudio,
  capabilities: renderCapabilities,
  experiments: renderExperiments,
  contact: renderContact,
}

export function renderPage(name: RouteName): string {
  return renderers[name]?.() ?? renderHome()
}
