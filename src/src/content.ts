// ─────────────────────────────────────────────────────────────
// BAKERY FILMS / AI — content model
// Swap `poster` / `video` in a Work to point at real media files
// and the site renders them instead of the procedural stand-ins.
// ─────────────────────────────────────────────────────────────

export type Motif =
  | 'woman'
  | 'city'
  | 'desert'
  | 'tokyo'
  | 'hotel'
  | 'reel'

export interface Work {
  id: string
  no: string // 01
  titleLines: { t: string; major?: boolean }[]
  cat: string
  runtime: string
  year: string
  format: string
  variant: 'a' | 'b' | 'c' | 'd' | 'e'
  motif: Motif
  poster?: string // still image URL — replaces the procedural stand-in
  video?: { src: string; poster?: string } // webm/mp4 sources replace projection
  lede: string
  beats: string[] // the "there was no …" edit lines
  credits: [string, string][]
}

export interface MakeItem {
  name: string
  cap: string
  mode: 'strip' | 'cinema' | 'grid' | 'still' | 'beat'
  outline?: boolean
}

export interface Experiment {
  id: string
  title: string
  desc: string
  tag: string
}

export interface Discipline {
  name: string
  flow: string[]
}

// ── ACT II — WHAT WE MAKE ───────────────────────────────────
export const MAKES: MakeItem[] = [
  { name: 'AI FILMS', cap: 'CINEMATIC SCENES NO ONE SHOT', mode: 'strip' },
  { name: 'COMMERCIALS', cap: 'PRODUCTS IN WORLDS THEY CANNOT ENTER', mode: 'cinema' },
  { name: 'CAMPAIGNS', cap: 'CAMPAIGN FRAMES, ART-DIRECTED AS A SHOOT', mode: 'grid', outline: true },
  { name: 'MUSIC VIDEOS', cap: 'CUT TO A TRACK THAT HAS NO RUSHES', mode: 'beat', outline: true },
  { name: 'STILL PHOTOGRAPHY', cap: 'PHOTOGRAPHS OF WHAT WAS NEVER THERE', mode: 'still' },
  { name: 'FASHION FILMS', cap: 'GARMENTS RENDERED, NOT SEWN', mode: 'cinema' },
  { name: 'BRAND WORLDS', cap: 'ONE WORLD, EVERY TOUCHPOINT', mode: 'still', outline: true },
  { name: 'EDITORIAL', cap: 'PAGES SET IN LIGHT', mode: 'cinema' },
  { name: 'PRODUCT FILMS', cap: 'OBJECTS THAT NEVER LEFT THE RENDER', mode: 'strip' },
  { name: 'VISUAL IDENTITIES', cap: 'IDENTITIES BUILT FRAME BY FRAME', mode: 'grid' },
  { name: 'EXPERIMENTAL IMAGE', cap: 'IMAGES WITH NO BRIEF, ONLY INSTINCT', mode: 'still', outline: true },
]

// ── ACT III — THE WORK ──────────────────────────────────────
export const WORKS: Work[] = [
  {
    id: 'woman',
    no: '01',
    titleLines: [
      { t: 'A WOMAN' },
      { t: 'WHO WAS' },
      { t: 'NEVER', major: true },
      { t: 'PHOTOGRAPHED.' },
    ],
    cat: 'FASHION CAMPAIGN',
    runtime: '00:48',
    year: '2026',
    format: 'STILL SET — 24 FRAMES',
    variant: 'a',
    motif: 'woman',
    poster: '/assets/images/IMAGE_10_THE_TURN.jpg',
    lede: 'A campaign built from nothing but light, memory and synthetic fabric. She was never in front of a camera — yet the photographs exist.',
    beats: ['There was no model.', 'There was no studio.', 'There was no camera.', 'Only the photographs exist.'],
    credits: [
      ['DIRECTED BY', 'BAKERY FILMS ASIA'],
      ['CAMERA', 'SYNTHETIC 85MM'],
      ['FABRIC', 'RENDERED SILK'],
      ['DELIVERED', 'PRINT + DIGITAL'],
    ],
  },
  {
    id: 'city',
    no: '02',
    titleLines: [{ t: 'A CITY' }, { t: 'THAT DOES' }, { t: 'NOT EXIST.', major: true }],
    cat: 'COMMERCIAL FILM',
    runtime: '01:20',
    year: '2026',
    format: '2.39:1 — COLOR',
    variant: 'b',
    motif: 'city',
    poster: '/assets/images/A-CITY-NEW.jpg',
    lede: 'A full commercial film shot in a city with no streets, no permits, no skyline. Generated, art-directed and graded like any other location shoot.',
    beats: ['There was no location.', 'There was no permit.', 'There was no skyline.', 'The weather was invented to order.'],
    credits: [
      ['DIRECTED BY', 'BAKERY FILMS ASIA'],
      ['LOCATION', 'NOWHERE, RENDERED'],
      ['GRADE', 'FUTURE NEUTRAL'],
      ['CLIENT', 'UNDISCLOSED'],
    ],
  },
  {
    id: 'car',
    no: '03',
    titleLines: [{ t: 'A CAR THROUGH' }, { t: 'A DESERT THAT' }, { t: 'WAS NEVER THERE.', major: true }],
    cat: 'AUTOMOTIVE',
    runtime: '00:32',
    year: '2026',
    format: '2.39:1 — 120FPS',
    variant: 'c',
    motif: 'desert',
    poster: '/assets/images/work/car-through-desert/scene1-infinite-road.jpg',
    lede: 'An automotive spot on a road that appears on no map. The dust, the heat and the light were rendered to order.',
    beats: ['There was no desert.', 'There was no road.', 'The car was never built.', 'Only the film is real.'],
    credits: [
      ['DIRECTED BY', 'BAKERY FILMS ASIA'],
      ['PRODUCTION', 'ZERO CARBON — ZERO ROAD'],
      ['DOP', 'VIRTUAL UNIT'],
      ['DELIVERED', 'BROADCAST + CINEMA'],
    ],
  },
  {
    id: 'tokyo',
    no: '04',
    titleLines: [{ t: 'MIDNIGHT /' }, { t: 'TOKYO /', major: true }, { t: '2096' }],
    cat: 'MUSIC VIDEO',
    runtime: '02:11',
    year: '2026',
    format: '16:9 — COLOR',
    variant: 'd',
    motif: 'tokyo',
    poster: '/assets/images/hero_01.jpg',
    lede: 'A music video set in Tokyo, 2096 — shot at no hour, on no street, in a city built one frame at a time.',
    beats: ['No train ran that night.', 'No street was lit.', 'The city was drawn one frame at a time.'],
    credits: [
      ['DIRECTED BY', 'BAKERY FILMS ASIA'],
      ['ARTIST', 'UNDISCLOSED'],
      ['VFX', 'THE WHOLE FILM'],
      ['SYNC', 'CUT TO TRACK'],
    ],
  },
  {
    id: 'hotel',
    no: '05',
    titleLines: [{ t: 'THE LAST HOTEL' }, { t: 'ON EARTH.', major: true }],
    cat: 'BRAND FILM',
    runtime: '01:42',
    year: '2026',
    format: '2.39:1 — COLOR',
    variant: 'e',
    motif: 'hotel',
    poster: '/assets/images/work/last-hotel.jpg',
    lede: 'A brand film about the last hotel on Earth. There was no location. There was no production crew. There was no hotel.',
    beats: ['There was no location.', 'There was no production crew.', 'There was no hotel.', 'And yet — you have seen it.'],
    credits: [
      ['DIRECTED BY', 'BAKERY FILMS ASIA'],
      ['CAST', 'NOBODY'],
      ['SOUND', 'DESIGNED, NOT RECORDED'],
      ['DELIVERED', 'WORLDWIDE'],
    ],
  },
]

// ── ACT IV — STUDIO ─────────────────────────────────────────
export const DISCIPLINES: Discipline[] = [
  { name: 'DIRECTING', flow: ['CONCEPT', 'NARRATIVE', 'PERFORMANCE'] },
  { name: 'ART DIRECTION', flow: ['WORLD', 'CHARACTER', 'LIGHT', 'MATERIAL'] },
  { name: 'IMAGE MAKING', flow: ['STILL', 'FASHION', 'PRODUCT', 'EDITORIAL'] },
  { name: 'MOTION', flow: ['FILM', 'COMMERCIAL', 'MUSIC VIDEO', 'CAMPAIGN'] },
  { name: 'AI PRODUCTION', flow: ['GENERATION', 'SELECTION', 'REFINEMENT', 'COMPOSITING'] },
  { name: 'POST', flow: ['EDIT', 'GRADE', 'SOUND', 'FINISH'] },
]

// ── EXPERIMENTS ─────────────────────────────────────────────
export const EXPERIMENTS: Experiment[] = [
  { id: 'humachine', title: 'HUMAN / MACHINE', desc: 'Where the brief ends and the machine begins.', tag: 'SERIES 01' },
  { id: 'arch', title: 'IMPOSSIBLE ARCHITECTURE', desc: 'Buildings that cannot stand — standing.', tag: 'IN PROGRESS' },
  { id: 'dream', title: 'DREAM SEQUENCES', desc: 'Sleep as cinema: no logic, no cuts.', tag: 'SELECTED FRAMES' },
  { id: 'fashion', title: 'SYNTHETIC FASHION', desc: 'Garments stitched from pixels and physics.', tag: 'MOTION' },
  { id: 'motion', title: 'MOTION STUDIES', desc: 'Velocity without mass. Weight without gravity.', tag: 'LAB' },
  { id: 'product', title: 'UNREAL PRODUCT', desc: 'Objects that never left the render.', tag: 'LAB' },
  { id: 'characters', title: 'CHARACTER STUDIES', desc: 'People who never existed — acting.', tag: 'SELECTED FRAMES' },
  { id: 'worlds', title: 'WORLD BUILDING', desc: 'Environments larger than the films inside them.', tag: 'IN PROGRESS' },
]

// ── ACT V — COMMISSION ──────────────────────────────────────
export const ORDER_KINDS = [
  'FILM',
  'COMMERCIAL',
  'CAMPAIGN',
  'MUSIC VIDEO',
  'STILL CAMPAIGN',
  'FASHION',
  'BRAND WORLD',
  'OTHER',
]

export const ORDER_WHEN = ['ASAP', 'THIS MONTH', 'NEXT QUARTER', 'JUST AN IDEA']
export const ORDER_BUDGET = ['< $50K', '$50–150K', '$150–500K', '$500K+']

export const REEL_WORDS = [
  'UNFINISHED FILM',
  'SET — NOWHERE',
  'CAMPAIGN FRAMES',
  'MIDNIGHT TOKYO',
  'LAST HOTEL',
  'SYNTHETIC FASHION',
  'DREAM LOGIC',
  'MOTION STUDY',
  'WORLD UNDER CONSTRUCTION',
  'CHARACTER — NOBODY',
  'LIGHT, RENDERED',
  'THE END?',
]
