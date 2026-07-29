import { writeFileSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'
import type { Message } from './llm.js'

const AIX_DIR = resolve(homedir(), '.aix')
const EXPORTS_DIR = join(AIX_DIR, 'exports')

// ── Power-ups ──

export interface PowerUp {
  id: string
  name: string
  emoji: string
  description: string
  multiplier: number
  durationMinutes: number
  cost: number  // XP cost to activate
}

export const POWER_UPS: PowerUp[] = [
  { id: 'double_xp', name: 'Double XP', emoji: '⚡', description: '2x XP for 10 minutes', multiplier: 2.0, durationMinutes: 10, cost: 100 },
  { id: 'triple_xp', name: 'Triple XP', emoji: '🔥', description: '3x XP for 5 minutes', multiplier: 3.0, durationMinutes: 5, cost: 250 },
  { id: 'mega_combo', name: 'Mega Combo', emoji: '💎', description: '1.5x combo multiplier for 15 minutes', multiplier: 1.5, durationMinutes: 15, cost: 150 },
  { id: 'streak_shield', name: 'Streak Shield', emoji: '🛡️', description: 'Protect your streak for 1 day', multiplier: 1.0, durationMinutes: 1440, cost: 200 },
  { id: 'instant_level', name: 'Instant Level Boost', emoji: '🚀', description: 'Gain 500 XP instantly', multiplier: 1.0, durationMinutes: 0, cost: 300 },
]

export function getActivePowerUp(stats: { powerUpActive: string | null; powerUpExpires: number }): PowerUp | null {
  if (!stats.powerUpActive) return null
  if (Date.now() > stats.powerUpExpires) return null
  return POWER_UPS.find(p => p.id === stats.powerUpActive) || null
}

export function activatePowerUp(stats: { xp: number; powerUpActive: string | null; powerUpExpires: number }, powerUpId: string): { success: boolean; message: string } {
  const powerUp = POWER_UPS.find(p => p.id === powerUpId)
  if (!powerUp) return { success: false, message: `Unknown power-up: ${powerUpId}` }
  if (stats.xp < powerUp.cost) return { success: false, message: `Not enough XP! Need ${powerUp.cost}, have ${stats.xp}` }
  if (stats.powerUpActive && Date.now() < stats.powerUpExpires) {
    return { success: false, message: `Power-up already active! (${stats.powerUpActive})` }
  }

  stats.xp -= powerUp.cost
  stats.powerUpActive = powerUpId
  stats.powerUpExpires = Date.now() + powerUp.durationMinutes * 60 * 1000

  if (powerUp.id === 'instant_level') {
    stats.xp += 500
    stats.powerUpActive = null
    return { success: true, message: `🚀 Gained 500 XP! (Net cost: ${powerUp.cost - 500} XP)` }
  }

  return { success: true, message: `${powerUp.emoji} ${powerUp.name} activated for ${powerUp.durationMinutes} minutes!` }
}

export function renderPowerUps(stats: { xp: number; powerUpActive: string | null; powerUpExpires: number }): string {
  const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', brightCyan: '\x1b[96m', brightGreen: '\x1b[92m',
    brightMagenta: '\x1b[95m',
  }

  const lines: string[] = []
  lines.push('')
  lines.push(`  ${C.bold}${C.brightMagenta}⚡ Power-Ups${C.reset} ${C.dim}(spend XP for temporary boosts)${C.reset}`)
  lines.push('')

  const active = getActivePowerUp(stats)
  if (active) {
    const remaining = Math.max(0, Math.round((stats.powerUpExpires - Date.now()) / 60000))
    lines.push(`  ${C.brightGreen}✓ Active: ${active.emoji} ${active.name} (${remaining} min remaining)${C.reset}`)
    lines.push('')
  }

  for (const p of POWER_UPS) {
    const canAfford = stats.xp >= p.cost
    const costColor = canAfford ? C.green : C.red
    lines.push(`  ${p.emoji} ${C.bold}${p.id.padEnd(16)}${C.reset} ${p.name.padEnd(20)} ${costColor}${p.cost} XP${C.reset}`)
    lines.push(`  ${''.padEnd(18)} ${C.dim}${p.description}${C.reset}`)
  }

  lines.push('')
  lines.push(`  ${C.dim}Your XP: ${stats.xp}  │  Activate: /powerup <id>${C.reset}`)
  return lines.join('\n')
}

// ── Macros ──

export function renderMacros(macros: Record<string, string>): string {
  const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    cyan: '\x1b[36m', brightCyan: '\x1b[96m',
  }

  const lines: string[] = []
  lines.push('')
  lines.push(`  ${C.bold}${C.cyan}📋 Macros${C.reset}`)
  lines.push('')

  const keys = Object.keys(macros)
  if (keys.length === 0) {
    lines.push(`  ${C.dim}No macros defined. Record one with /macro record <name>${C.reset}`)
  } else {
    for (const key of keys) {
      lines.push(`  ${C.bold}${key.padEnd(16)}${C.reset} ${C.dim}→${C.reset} ${macros[key].slice(0, 60)}${macros[key].length > 60 ? '...' : ''}`)
    }
    lines.push('')
    lines.push(`  ${C.dim}Run: /macro <name>  │  Delete: /macro delete <name>${C.reset}`)
  }

  return lines.join('\n')
}

// ── Export ──

export function exportConversation(history: Message[], format: 'markdown' | 'json' = 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(history, null, 2)
  }

  const lines: string[] = []
  lines.push('# aix Conversation Export')
  lines.push(`Exported: ${new Date().toISOString()}`)
  lines.push('---')
  lines.push('')

  for (const msg of history) {
    if (msg.role === 'user') {
      lines.push(`## User`)
      lines.push('')
      const content = typeof msg.content === 'string' ? msg.content : msg.content.map(p => p.text || '').join('\n')
      lines.push(content)
      lines.push('')
    } else if (msg.role === 'assistant') {
      lines.push(`## Assistant`)
      lines.push('')
      const content = typeof msg.content === 'string' ? msg.content : msg.content.map(p => p.text || '').join('\n')
      lines.push(content)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export function saveExport(history: Message[], format: 'markdown' | 'json' = 'markdown'): string {
  mkdirSync(EXPORTS_DIR, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const ext = format === 'json' ? 'json' : 'md'
  const filePath = join(EXPORTS_DIR, `conversation-${timestamp}.${ext}`)
  const content = exportConversation(history, format)
  writeFileSync(filePath, content, 'utf-8')
  return filePath
}

// ── Time-aware greetings ──

export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return '🌙 Late night coding session'
  if (hour < 8) return '🌅 Early morning, let\'s get coding'
  if (hour < 12) return '☀️ Good morning, ready to code'
  if (hour < 14) return '🌤️ Lunch break coding'
  if (hour < 17) return '☀️ Afternoon coding session'
  if (hour < 20) return '🌆 Evening coding, nice'
  if (hour < 22) return '🌙 Night owl mode'
  return '🦉 Late night coding, stay sharp'
}

// ── Syntax highlighting for code blocks ──

export function highlightCode(code: string, lang?: string): string {
  const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
    brightBlue: '\x1b[94m', brightCyan: '\x1b[96m',
    brightGreen: '\x1b[92m', brightMagenta: '\x1b[95m',
    brightYellow: '\x1b[93m', brightRed: '\x1b[91m',
  }

  // Simple keyword highlighting based on language
  const keywords: Record<string, string[]> = {
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'import', 'export', 'from', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw', 'switch', 'case', 'default', 'break', 'continue', 'typeof', 'instanceof', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'enum', 'namespace', 'as', 'is', 'in', 'of', 'void', 'null', 'undefined', 'true', 'false'],
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw', 'switch', 'case', 'default', 'break', 'continue', 'typeof', 'instanceof', 'extends', 'null', 'undefined', 'true', 'false'],
    python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'async', 'await', 'yield', 'lambda', 'pass', 'raise', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self', 'super', 'global', 'nonlocal'],
    rust: ['fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'self', 'Self', 'super', 'crate', 'async', 'await', 'where', 'type', 'const', 'static', 'unsafe', 'extern', 'true', 'false', 'Some', 'None', 'Ok', 'Err'],
  }

  const langKey = (lang || '').toLowerCase().replace('ts', 'typescript').replace('js', 'javascript').replace('py', 'python').replace('rs', 'rust')
  const kws = keywords[langKey]
  if (!kws) return code

  let result = code
  // Highlight keywords
  for (const kw of kws) {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    result = result.replace(regex, `${C.brightMagenta}${kw}${C.reset}`)
  }
  // Highlight strings (single and double quotes)
  result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, match => `${C.brightGreen}${match}${C.reset}`)
  // Highlight comments (// and #)
  result = result.replace(/(\/\/.*$|#.*$)/gm, match => `${C.dim}${match}${C.reset}`)
  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, `${C.brightYellow}$1${C.reset}`)

  return result
}
