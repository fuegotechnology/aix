import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'
import type { Message } from './llm.js'
import { bold, dim, cyan, green, red, yellow, brightCyan, brightGreen, magenta, gray } from './ui.js'

const AIX_DIR = resolve(homedir(), '.aix')
const SESSIONS_DIR = join(AIX_DIR, 'sessions')

export interface SessionMeta {
  id: string
  name: string
  provider: string
  model: string
  vibe: string
  cwd: string
  messageCount: number
  totalTokensIn: number
  totalTokensOut: number
  createdAt: string
  updatedAt: string
  autoSave: boolean
}

export interface SessionData {
  meta: SessionMeta
  history: Message[]
}

export interface SessionSummary {
  id: string
  name: string
  provider: string
  model: string
  vibe: string
  messageCount: number
  updatedAt: string
  createdAt: string
  age: string
}

function ensureSessionsDir(): void {
  mkdirSync(SESSIONS_DIR, { recursive: true })
}

function sessionPath(id: string): string {
  return join(SESSIONS_DIR, `${id}.json`)
}

function generateId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toISOString().slice(11, 19).replace(/:/g, '')
  const rand = Math.random().toString(36).slice(2, 6)
  return `${date}-${time}-${rand}`
}

function formatAge(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(isoDate).toLocaleDateString()
}

// ─── Create ────────────────────────────────────────────────────────

export function createSession(opts: {
  provider: string
  model: string
  vibe: string
  cwd: string
  name?: string
}): SessionData {
  const id = generateId()
  const now = new Date().toISOString()
  const meta: SessionMeta = {
    id,
    name: opts.name || `Session ${id.slice(0, 11)}`,
    provider: opts.provider,
    model: opts.model,
    vibe: opts.vibe,
    cwd: opts.cwd,
    messageCount: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    createdAt: now,
    updatedAt: now,
    autoSave: true,
  }
  return { meta, history: [] }
}

// ─── Save ──────────────────────────────────────────────────────────

export function saveSession(session: SessionData): void {
  ensureSessionsDir()
  session.meta.updatedAt = new Date().toISOString()
  session.meta.messageCount = session.history.length
  writeFileSync(sessionPath(session.meta.id), JSON.stringify(session, null, 2), 'utf-8')
}

// ─── Load ──────────────────────────────────────────────────────────

export function loadSession(id: string): SessionData | null {
  const file = sessionPath(id)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as SessionData
  } catch {
    return null
  }
}

// ─── List ──────────────────────────────────────────────────────────

export function listSessions(): SessionSummary[] {
  ensureSessionsDir()
  const files = readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()

  const sessions: SessionSummary[] = []
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(SESSIONS_DIR, f), 'utf-8'))
      const meta = data.meta || {}
      sessions.push({
        id: meta.id || f.replace('.json', ''),
        name: meta.name || 'Untitled',
        provider: meta.provider || 'unknown',
        model: meta.model || 'unknown',
        vibe: meta.vibe || 'default',
        messageCount: meta.messageCount || (data.history || []).length,
        updatedAt: meta.updatedAt || meta.createdAt || '',
        createdAt: meta.createdAt || '',
        age: formatAge(meta.updatedAt || meta.createdAt || ''),
      })
    } catch {
      // skip corrupt files
    }
  }
  return sessions
}

// ─── Delete ────────────────────────────────────────────────────────

export function deleteSession(id: string): boolean {
  const file = sessionPath(id)
  if (!existsSync(file)) return false
  try {
    unlinkSync(file)
    return true
  } catch {
    return false
  }
}

// ─── Rename ────────────────────────────────────────────────────────

export function renameSession(id: string, newName: string): boolean {
  const session = loadSession(id)
  if (!session) return false
  session.meta.name = newName
  saveSession(session)
  return true
}

// ─── Get last session ──────────────────────────────────────────────

export function getLastSession(): SessionData | null {
  const sessions = listSessions()
  if (sessions.length === 0) return null
  return loadSession(sessions[0].id)
}

// ─── Find session by partial ID or name ────────────────────────────

export function findSession(query: string): SessionData | null {
  // Try exact ID match first
  const exact = loadSession(query)
  if (exact) return exact

  // Try partial ID match
  const sessions = listSessions()
  const partial = sessions.find(s => s.id.startsWith(query))
  if (partial) return loadSession(partial.id)

  // Try name match (case-insensitive)
  const byName = sessions.find(s => s.name.toLowerCase() === query.toLowerCase())
  if (byName) return loadSession(byName.id)

  // Try name partial match
  const byNamePartial = sessions.find(s => s.name.toLowerCase().includes(query.toLowerCase()))
  if (byNamePartial) return loadSession(byNamePartial.id)

  return null
}

// ─── Render ────────────────────────────────────────────────────────

export function renderSessionList(sessions: SessionSummary[]): string {
  if (sessions.length === 0) {
    return dim('  No saved sessions. Start chatting and use /save to save your session.')
  }

  const lines: string[] = []
  lines.push('')
  lines.push(`  ${bold('📋 Saved Sessions')} ${dim(`(${sessions.length} total)`)}`)
  lines.push(`  ${dim('─'.repeat(70))}`)

  for (let i = 0; i < Math.min(sessions.length, 20); i++) {
    const s = sessions[i]
    const idx = `${i + 1}`.padEnd(2)
    const name = s.name.length > 28 ? s.name.slice(0, 25) + '...' : s.name
    const provider = s.provider.padEnd(12)
    const model = s.model.length > 18 ? s.model.slice(0, 15) + '...' : s.model
    const msgCount = `${s.messageCount} msgs`
    const age = s.age

    lines.push(`  ${dim(idx)} ${bold(name.padEnd(30))} ${cyan(provider)} ${dim(model.padEnd(18))} ${dim(msgCount.padEnd(8))} ${dim(age)}`)
  }

  if (sessions.length > 20) {
    lines.push(`  ${dim(`... and ${sessions.length - 20} more`)}`)
  }

  lines.push('')
  lines.push(`  ${dim('Resume:')}  ${brightCyan('aix --session <id>')}  or  ${brightCyan('/resume <id>')}`)
  lines.push(`  ${dim('Delete:')}  ${brightCyan('/sessions delete <id>')}`)
  lines.push(`  ${dim('Rename:')}  ${brightCyan('/sessions rename <id> <name>')}`)
  lines.push('')

  return lines.join('\n')
}

export function renderSessionInfo(session: SessionData): string {
  const m = session.meta
  const lines: string[] = []
  lines.push('')
  lines.push(`  ${bold('📋 Session Info')}`)
  lines.push(`  ${dim('─'.repeat(50))}`)
  lines.push(`  ID:       ${brightCyan(m.id)}`)
  lines.push(`  Name:     ${m.name}`)
  lines.push(`  Provider: ${m.provider}`)
  lines.push(`  Model:    ${m.model}`)
  lines.push(`  Vibe:     ${m.vibe}`)
  lines.push(`  Messages: ${m.messageCount}`)
  lines.push(`  Tokens:   ${m.totalTokensIn.toLocaleString()} in / ${m.totalTokensOut.toLocaleString()} out`)
  lines.push(`  Created:  ${new Date(m.createdAt).toLocaleString()}`)
  lines.push(`  Updated:  ${new Date(m.updatedAt).toLocaleString()}`)
  lines.push(`  Auto-save: ${m.autoSave ? green('on') : red('off')}`)
  lines.push('')
  return lines.join('\n')
}

export function renderSessionResumed(session: SessionData): string {
  const m = session.meta
  const lines: string[] = []
  lines.push(`  ${brightGreen('▶')} ${bold('Resumed session')} ${brightCyan(m.name)}`)
  lines.push(`  ${dim(`${m.messageCount} messages │ ${m.provider} │ ${m.model} │ ${m.vibe}`)}`)
  lines.push(`  ${dim(`Last active: ${formatAge(m.updatedAt)}`)}`)
  return lines.join('\n')
}

export function renderSessionSaved(session: SessionData): string {
  const m = session.meta
  return `  ${brightGreen('✓')} Session saved: ${brightCyan(m.name)} ${dim(`(${m.id})`)}`
}

// ─── Search sessions ───────────────────────────────────────────────

export function searchSessions(query: string): SessionSummary[] {
  const all = listSessions()
  if (!query) return all
  const q = query.toLowerCase()
  return all.filter(s => {
    const data = loadSession(s.id)
    if (!data) return false
    if (s.name.toLowerCase().includes(q)) return true
    if (s.id.toLowerCase().includes(q)) return true
    if (s.provider.toLowerCase().includes(q)) return true
    if (s.model.toLowerCase().includes(q)) return true
    if (s.vibe.toLowerCase().includes(q)) return true
    for (const msg of data.history) {
      if (typeof msg.content === 'string' && msg.content.toLowerCase().includes(q)) return true
    }
    return false
  })
}

// ─── Clear all sessions ────────────────────────────────────────────

export function clearAllSessions(): number {
  const all = listSessions()
  let deleted = 0
  for (const s of all) {
    if (deleteSession(s.id)) deleted++
  }
  return deleted
}

// ─── Export & Import session JSON ──────────────────────────────────

export function exportSessionToFile(id: string, filePath: string): boolean {
  const data = loadSession(id)
  if (!data) return false
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}

export function importSessionFromFile(filePath: string): SessionData | null {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as SessionData
    if (!data || !data.meta || !Array.isArray(data.history)) return null
    if (!data.meta.id || existsSync(sessionPath(data.meta.id))) {
      data.meta.id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }
    saveSession(data)
    return data
  } catch {
    return null
  }
}
