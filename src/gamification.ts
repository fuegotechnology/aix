import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'

const AIX_DIR = resolve(homedir(), '.aix')
const STATS_FILE = join(AIX_DIR, 'stats.json')

export interface Stats {
  xp: number
  level: number
  streak: number
  lastUsed: string
  totalMessages: number
  totalToolCalls: number
  totalFilesEdited: number
  totalBashCommands: number
  totalTokensIn: number
  totalTokensOut: number
  totalSessions: number
  achievements: string[]
  providerUsage: Record<string, number>
  vibeUsage: Record<string, number>
  createdAt: string
}

export interface Level {
  level: number
  name: string
  title: string
  xpRequired: number
  emoji: string
  color: string
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Initiate', title: 'Just getting started', xpRequired: 0, emoji: '🌱', color: '\x1b[90m' },
  { level: 2, name: 'Apprentice', title: 'Learning the ropes', xpRequired: 50, emoji: '📖', color: '\x1b[37m' },
  { level: 3, name: 'Coder', title: 'Writing code like a pro', xpRequired: 150, emoji: '💻', color: '\x1b[32m' },
  { level: 4, name: 'Hacker', title: 'Deep in the terminal', xpRequired: 350, emoji: '⚡', color: '\x1b[33m' },
  { level: 5, name: 'Architect', title: 'Building systems', xpRequired: 700, emoji: '🏗️', color: '\x1b[36m' },
  { level: 6, name: 'Expert', title: 'Seasoned veteran', xpRequired: 1200, emoji: '🏆', color: '\x1b[35m' },
  { level: 7, name: 'Master', title: 'Master of code', xpRequired: 2000, emoji: '👑', color: '\x1b[93m' },
  { level: 8, name: 'Grandmaster', title: 'Legendary status', xpRequired: 3500, emoji: '💎', color: '\x1b[94m' },
  { level: 9, name: 'Transcendent', title: 'Beyond mortal code', xpRequired: 5500, emoji: '🌟', color: '\x1b[95m' },
  { level: 10, name: 'aix Ascended', title: 'One with the terminal', xpRequired: 10000, emoji: '🔮', color: '\x1b[96m' },
]

export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  condition: (stats: Stats) => boolean
  xp: number
  secret?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_chat', name: 'First Contact', description: 'Send your first message', emoji: '👋', condition: s => s.totalMessages >= 1, xp: 10 },
  { id: 'ten_messages', name: 'Getting Warmed Up', description: 'Send 10 messages', emoji: '🔥', condition: s => s.totalMessages >= 10, xp: 25 },
  { id: 'fifty_messages', name: 'Regular User', description: 'Send 50 messages', emoji: '💬', condition: s => s.totalMessages >= 50, xp: 50 },
  { id: 'hundred_messages', name: 'Power User', description: 'Send 100 messages', emoji: '💪', condition: s => s.totalMessages >= 100, xp: 100 },
  { id: 'five_hundred_messages', name: 'aix Addict', description: 'Send 500 messages', emoji: '🤯', condition: s => s.totalMessages >= 500, xp: 250 },
  { id: 'first_tool', name: 'Tool User', description: 'Use your first tool', emoji: '🔧', condition: s => s.totalToolCalls >= 1, xp: 10 },
  { id: 'ten_tools', name: 'Tool Enthusiast', description: 'Use 10 tools', emoji: '🛠️', condition: s => s.totalToolCalls >= 10, xp: 25 },
  { id: 'fifty_tools', name: 'Tool Master', description: 'Use 50 tools', emoji: '⚙️', condition: s => s.totalToolCalls >= 50, xp: 75 },
  { id: 'two_hundred_tools', name: 'Tool Legend', description: 'Use 200 tools', emoji: '⚡', condition: s => s.totalToolCalls >= 200, xp: 200 },
  { id: 'first_edit', name: 'First Edit', description: 'Edit your first file', emoji: '✏️', condition: s => s.totalFilesEdited >= 1, xp: 10 },
  { id: 'ten_edits', name: 'Editor', description: 'Edit 10 files', emoji: '📝', condition: s => s.totalFilesEdited >= 10, xp: 25 },
  { id: 'fifty_edits', name: 'Code Sculptor', description: 'Edit 50 files', emoji: '🎨', condition: s => s.totalFilesEdited >= 50, xp: 75 },
  { id: 'first_bash', name: 'Shell Runner', description: 'Run your first bash command', emoji: '🖥️', condition: s => s.totalBashCommands >= 1, xp: 10 },
  { id: 'ten_bash', name: 'Command Line Pro', description: 'Run 10 bash commands', emoji: '⌨️', condition: s => s.totalBashCommands >= 10, xp: 25 },
  { id: 'fifty_bash', name: 'Shell Wizard', description: 'Run 50 bash commands', emoji: '🧙', condition: s => s.totalBashCommands >= 50, xp: 75 },
  { id: 'streak_3', name: 'On a Roll', description: '3-day streak', emoji: '🔥', condition: s => s.streak >= 3, xp: 25 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', emoji: '⚔️', condition: s => s.streak >= 7, xp: 75 },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', emoji: '🏆', condition: s => s.streak >= 30, xp: 300 },
  { id: 'streak_100', name: 'Unstoppable', description: '100-day streak', emoji: '🌟', condition: s => s.streak >= 100, xp: 1000 },
  { id: 'provider_3', name: 'Multi-Provider', description: 'Use 3 different providers', emoji: '🌐', condition: s => Object.keys(s.providerUsage).length >= 3, xp: 25 },
  { id: 'provider_5', name: 'Provider Explorer', description: 'Use 5 different providers', emoji: '🗺️', condition: s => Object.keys(s.providerUsage).length >= 5, xp: 50 },
  { id: 'provider_10', name: 'Provider Connoisseur', description: 'Use 10 different providers', emoji: '🎯', condition: s => Object.keys(s.providerUsage).length >= 10, xp: 150 },
  { id: 'vibe_3', name: 'Vibe Switcher', description: 'Try 3 different vibes', emoji: '🎭', condition: s => Object.keys(s.vibeUsage).length >= 3, xp: 25 },
  { id: 'vibe_5', name: 'Vibe Master', description: 'Try 5 different vibes', emoji: '🌈', condition: s => Object.keys(s.vibeUsage).length >= 5, xp: 50 },
  { id: 'vibe_all', name: 'Vibe Chameleon', description: 'Try every vibe', emoji: '🦎', condition: s => Object.keys(s.vibeUsage).length >= 10, xp: 150 },
  { id: 'level_5', name: 'Architect Rising', description: 'Reach level 5', emoji: '🏗️', condition: s => s.level >= 5, xp: 0 },
  { id: 'level_10', name: 'Ascended', description: 'Reach max level', emoji: '🔮', condition: s => s.level >= 10, xp: 0 },
  { id: 'free_only', name: 'Free Spirit', description: 'Use only free providers for 50 messages', emoji: '🆓', condition: s => s.totalMessages >= 50 && Object.keys(s.providerUsage).every(p => {
    const freeProviders = ['pollinations','llm7','ollama','lmstudio','jan','vllm','llamacpp']
    return freeProviders.includes(p)
  }), xp: 100 },
  { id: 'million_tokens', name: 'Million Token Club', description: 'Process 1M+ tokens total', emoji: '🎰', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 1000000, xp: 200 },
  { id: 'night_owl', name: 'Night Owl', description: 'Use aix after midnight', emoji: '🦉', condition: s => s.totalMessages >= 1, xp: 15, secret: true },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Send 5 messages in one session', emoji: '💨', condition: s => s.totalMessages >= 5, xp: 15 },
  { id: 'free_bird', name: 'Free Bird', description: 'Use Pollinations (no key needed)', emoji: '🐦', condition: s => (s.providerUsage['pollinations'] || 0) >= 1, xp: 10 },
  { id: 'local_hero', name: 'Local Hero', description: 'Use a local provider', emoji: '🏠', condition: s => ['ollama','lmstudio','jan','vllm','llamacpp'].some(p => (s.providerUsage[p] || 0) > 0), xp: 25 },
]

export function loadStats(): Stats {
  if (!existsSync(STATS_FILE)) {
    return {
      xp: 0,
      level: 1,
      streak: 0,
      lastUsed: '',
      totalMessages: 0,
      totalToolCalls: 0,
      totalFilesEdited: 0,
      totalBashCommands: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalSessions: 0,
      achievements: [],
      providerUsage: {},
      vibeUsage: {},
      createdAt: new Date().toISOString(),
    }
  }
  try {
    return JSON.parse(readFileSync(STATS_FILE, 'utf-8'))
  } catch {
    return {
      xp: 0, level: 1, streak: 0, lastUsed: '', totalMessages: 0,
      totalToolCalls: 0, totalFilesEdited: 0, totalBashCommands: 0,
      totalTokensIn: 0, totalTokensOut: 0, totalSessions: 0,
      achievements: [], providerUsage: {}, vibeUsage: {},
      createdAt: new Date().toISOString(),
    }
  }
}

export function saveStats(stats: Stats): void {
  mkdirSync(AIX_DIR, { recursive: true })
  writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
}

export function getLevelForXp(xp: number): Level {
  let result = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      result = level
    }
  }
  return result
}

export function getXpForNextLevel(currentLevel: number): { current: number; next: number; xpNeeded: number } {
  const currentLevelDef = LEVELS.find(l => l.level === currentLevel) || LEVELS[0]
  const nextLevelDef = LEVELS.find(l => l.level === currentLevel + 1)
  return {
    current: currentLevelDef.xpRequired,
    next: nextLevelDef ? nextLevelDef.xpRequired : currentLevelDef.xpRequired,
    xpNeeded: nextLevelDef ? nextLevelDef.xpRequired - currentLevelDef.xpRequired : 0,
  }
}

export function checkNewAchievements(stats: Stats): Achievement[] {
  const newAchievements: Achievement[] = []
  for (const achievement of ACHIEVEMENTS) {
    if (!stats.achievements.includes(achievement.id) && achievement.condition(stats)) {
      stats.achievements.push(achievement.id)
      stats.xp += achievement.xp
      newAchievements.push(achievement)
    }
  }
  return newAchievements
}

export function updateStreak(stats: Stats): void {
  const today = new Date().toISOString().split('T')[0]
  if (stats.lastUsed === today) return

  if (stats.lastUsed) {
    const lastDate = new Date(stats.lastUsed)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      stats.streak++
    } else if (diffDays > 1) {
      stats.streak = 1
    }
  } else {
    stats.streak = 1
  }
  stats.lastUsed = today
}

export function addXp(stats: Stats, amount: number): { leveledUp: boolean; newLevel: Level; oldLevel: Level } {
  const oldLevel = getLevelForXp(stats.xp)
  stats.xp += amount
  const newLevel = getLevelForXp(stats.xp)
  stats.level = newLevel.level
  return {
    leveledUp: newLevel.level > oldLevel.level,
    newLevel,
    oldLevel,
  }
}

export function renderXpBar(stats: Stats, width: number = 20): string {
  const { current, next, xpNeeded } = getXpForNextLevel(stats.level)
  if (xpNeeded === 0) return `${'█'.repeat(width)} MAX`
  const progress = (stats.xp - current) / (next - current)
  const filled = Math.round(progress * width)
  const empty = width - filled
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`
  return `${bar} ${stats.xp - current}/${xpNeeded} XP`
}

export function renderStats(stats: Stats): string {
  const level = getLevelForXp(stats.xp)
  const lines: string[] = []
  lines.push(`  ${level.color}${level.emoji} Level ${level.level}: ${level.name}${'\x1b[0m'}`)
  lines.push(`  ${level.color}${level.title}${'\x1b[0m'}`)
  lines.push(`  ${renderXpBar(stats)}`)
  lines.push('')
  lines.push(`  💬 Messages: ${stats.totalMessages}  🔧 Tools: ${stats.totalToolCalls}  ✏️ Edits: ${stats.totalFilesEdited}`)
  lines.push(`  🖥️ Commands: ${stats.totalBashCommands}  🔥 Streak: ${stats.streak} days`)
  lines.push(`  🪙 Total XP: ${stats.xp}  🏆 Achievements: ${stats.achievements.length}/${ACHIEVEMENTS.length}`)
  return lines.join('\n')
}

export function renderAchievementUnlock(achievement: Achievement): string {
  const lines: string[] = []
  lines.push('')
  lines.push('  ╔══════════════════════════════════════╗')
  lines.push('  ║  🏆 ACHIEVEMENT UNLOCKED!            ║')
  lines.push(`  ║  ${achievement.emoji} ${achievement.name.padEnd(30)}║`)
  lines.push(`  ║  ${achievement.description.padEnd(34)}║`)
  lines.push(`  ║  +${String(achievement.xp).padEnd(3)} XP${' '.repeat(27)}║`)
  lines.push('  ╚══════════════════════════════════════╝')
  lines.push('')
  return lines.join('\n')
}

export function renderLevelUp(oldLevel: Level, newLevel: Level): string {
  const lines: string[] = []
  lines.push('')
  lines.push('  ╔══════════════════════════════════════════╗')
  lines.push('  ║  ⬆️  LEVEL UP!                           ║')
  lines.push(`  ║  ${oldLevel.emoji} Lv.${oldLevel.level} ${oldLevel.name}`)
  lines.push(`  ║  ────────────────►`)
  lines.push(`  ║  ${newLevel.emoji} Lv.${newLevel.level} ${newLevel.name}`)
  lines.push(`  ║  ${newLevel.title}`)
  lines.push('  ╚══════════════════════════════════════════╝')
  lines.push('')
  return lines.join('\n')
}
