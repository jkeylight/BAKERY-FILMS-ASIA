// ─────────────────────────────────────────────────────────────
// BAKERY FILMS / AI — production server
// Serves the built SPA + handles POST /api/commission
// ─────────────────────────────────────────────────────────────

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const DATA_DIR = join(__dirname, '..', 'data')
const BRIEFS_FILE = join(DATA_DIR, 'briefs.json')
const PORT = Number(process.env.PORT) || 3000

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

async function ensureDataDir() {
  try { await mkdir(DATA_DIR, { recursive: true }) } catch { /* exists */ }
}

async function readBriefs(): Promise<Array<Record<string, string>>> {
  try {
    const raw = await readFile(BRIEFS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeBriefs(briefs: Array<Record<string, string>>) {
  await ensureDataDir()
  await writeFile(BRIEFS_FILE, JSON.stringify(briefs, null, 2))
}

function generateDirectorNote(brief: Record<string, string>): string {
  const notes = [
    `Dear ${brief.name},`,
    '',
    `Thank you for bringing "${brief.kind}" to Bakery Films. We've received your brief and the creative team is reviewing it now.`,
    '',
    `What strikes us most: ${brief.brief.slice(0, 120)}${brief.brief.length > 120 ? '…' : ''}`,
    '',
    `Timeline: ${brief.when}`,
    `Budget frame: ${brief.budget}`,
    '',
    'We don\'t send quotes — we send director\'s notes. Expect ours within 48 hours.',
    '',
    'BAKERY FILMS / AI',
    'We make films that never happened.',
  ]
  return notes.join('\n')
}

async function handleCommission(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) {
  try {
    const body = JSON.parse(await readBody(req))
    const { kind, brief, when, budget, name, email } = body

    if (!kind || !brief || !name || !email) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing required fields: kind, brief, name, email' }))
      return
    }

    const briefs = await readBriefs()
    const entry = {
      kind,
      brief,
      when: when || 'ASAP',
      budget: budget || 'TO DISCUSS',
      name,
      email,
      timestamp: new Date().toISOString(),
      id: String(briefs.length + 1).padStart(4, '0'),
    }
    briefs.push(entry)
    await writeBriefs(briefs)

    const directorNote = generateDirectorNote(entry)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      success: true,
      id: entry.id,
      directorNote,
    }))
  } catch (err) {
    console.error('[commission] error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

async function serveStatic(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  let filePath = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname)

  // SPA fallback: if the file doesn't exist and it's not an asset, serve index.html
  try {
    await readFile(filePath)
  } catch {
    // If it looks like a route (no extension), serve index.html
    if (!extname(url.pathname)) {
      filePath = join(DIST, 'index.html')
    } else {
      res.writeHead(404); res.end('Not found'); return
    }
  }

  const ext = extname(filePath)
  const mime = MIME[ext] ?? 'application/octet-stream'

  try {
    const data = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    res.end(data)
  } catch {
    res.writeHead(500); res.end('Server error')
  }
}

const server = createServer(async (req, res) => {
  // CORS headers for dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'POST' && req.url === '/api/commission') {
    return handleCommission(req, res)
  }

  serveStatic(req, res)
})

server.listen(PORT, () => {
  console.log('\n  🎬 BAKERY FILMS / AI')
  console.log(`  http://localhost:${PORT}`)
  console.log(`  http://localhost:${PORT}/?motion=1\n`)
  console.log(`  Commission API: POST http://localhost:${PORT}/api/commission`)
  console.log(`  Briefs stored:  ${BRIEFS_FILE}\n`)
})
