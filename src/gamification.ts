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
  // Combo system
  combo: number
  maxCombo: number
  lastMessageTime: number
  totalCombos: number
  // Daily challenges
  dailyChallenge: string | null
  dailyChallengeDate: string | null
  dailyChallengeProgress: number
  dailyChallengeCompleted: boolean
  // Titles
  activeTitle: string | null
  unlockedTitles: string[]
  // Sessions
  messagesThisSession: number
  toolsThisSession: number
  editsThisSession: number
  // Power-ups
  powerUpActive: string | null
  powerUpExpires: number
  // Weekly challenges
  weeklyChallenge: string | null
  weeklyChallengeDate: string | null
  weeklyChallengeProgress: number
  weeklyChallengeCompleted: boolean
  // Quests
  activeQuests: string[]
  completedQuests: string[]
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
  { level: 1,  name: 'Initiate',      title: 'Just getting started',          xpRequired: 0,      emoji: '🌱', color: '\x1b[90m' },
  { level: 2,  name: 'Apprentice',    title: 'Learning the ropes',            xpRequired: 50,     emoji: '📖', color: '\x1b[37m' },
  { level: 3,  name: 'Coder',         title: 'Writing code like a pro',       xpRequired: 150,    emoji: '💻', color: '\x1b[32m' },
  { level: 4,  name: 'Hacker',        title: 'Deep in the terminal',          xpRequired: 350,    emoji: '⚡', color: '\x1b[33m' },
  { level: 5,  name: 'Architect',     title: 'Building systems',              xpRequired: 700,    emoji: '🏗️', color: '\x1b[36m' },
  { level: 6,  name: 'Expert',        title: 'Seasoned veteran',              xpRequired: 1200,   emoji: '🏆', color: '\x1b[35m' },
  { level: 7,  name: 'Master',        title: 'Master of code',                xpRequired: 2000,   emoji: '👑', color: '\x1b[93m' },
  { level: 8,  name: 'Grandmaster',   title: 'Legendary status',              xpRequired: 3500,   emoji: '💎', color: '\x1b[94m' },
  { level: 9,  name: 'Transcendent',  title: 'Beyond mortal code',            xpRequired: 5500,   emoji: '🌟', color: '\x1b[95m' },
  { level: 10, name: 'aix Ascended',  title: 'One with the terminal',         xpRequired: 10000,  emoji: '🔮', color: '\x1b[96m' },
  { level: 11, name: 'Mythic',        title: 'Code flows through you',        xpRequired: 15000,  emoji: '⚔️', color: '\x1b[91m' },
  { level: 12, name: 'Celestial',     title: 'The stars are your IDE',        xpRequired: 25000,  emoji: '✨', color: '\x1b[96m' },
  { level: 13, name: 'Eternal',       title: 'Code transcends time',          xpRequired: 50000,  emoji: '🌀', color: '\x1b[95m' },
  { level: 14, name: 'Omega',         title: 'The final form of code',        xpRequired: 100000, emoji: '💠', color: '\x1b[94m' },
  { level: 15, name: 'Apotheosis',    title: 'You ARE the code',              xpRequired: 200000, emoji: '🌠', color: '\x1b[93m' },
]

export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  condition: (stats: Stats) => boolean
  xp: number
  secret?: boolean
  title?: string
  category?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── First Steps ──
  { id: 'first_chat', name: 'First Contact', description: 'Send your first message', emoji: '👋', condition: s => s.totalMessages >= 1, xp: 10, category: 'first' },
  { id: 'first_tool', name: 'Tool User', description: 'Use your first tool', emoji: '🔧', condition: s => s.totalToolCalls >= 1, xp: 10, category: 'first' },
  { id: 'first_edit', name: 'First Edit', description: 'Edit your first file', emoji: '✏️', condition: s => s.totalFilesEdited >= 1, xp: 10, category: 'first' },
  { id: 'first_bash', name: 'Shell Runner', description: 'Run your first bash command', emoji: '🖥️', condition: s => s.totalBashCommands >= 1, xp: 10, category: 'first' },
  { id: 'first_vibe', name: 'Vibe Check', description: 'Try your first vibe', emoji: '🎭', condition: s => Object.keys(s.vibeUsage).length >= 1, xp: 10, category: 'first' },

  // ── Messages ──
  { id: 'ten_messages', name: 'Getting Warmed Up', description: 'Send 10 messages', emoji: '🔥', condition: s => s.totalMessages >= 10, xp: 25, category: 'messages' },
  { id: 'fifty_messages', name: 'Regular User', description: 'Send 50 messages', emoji: '💬', condition: s => s.totalMessages >= 50, xp: 50, category: 'messages' },
  { id: 'hundred_messages', name: 'Power User', description: 'Send 100 messages', emoji: '💪', condition: s => s.totalMessages >= 100, xp: 100, category: 'messages' },
  { id: 'five_hundred_messages', name: 'aix Addict', description: 'Send 500 messages', emoji: '🤯', condition: s => s.totalMessages >= 500, xp: 250, category: 'messages' },
  { id: 'thousand_messages', name: 'aix For Life', description: 'Send 1,000 messages', emoji: '❤️‍🔥', condition: s => s.totalMessages >= 1000, xp: 500, category: 'messages' },
  { id: 'five_thousand_messages', name: 'Living in the Terminal', description: 'Send 5,000 messages', emoji: '🏠', condition: s => s.totalMessages >= 5000, xp: 1500, category: 'messages' },

  // ── Tools ──
  { id: 'ten_tools', name: 'Tool Enthusiast', description: 'Use 10 tools', emoji: '🛠️', condition: s => s.totalToolCalls >= 10, xp: 25, category: 'tools' },
  { id: 'fifty_tools', name: 'Tool Master', description: 'Use 50 tools', emoji: '⚙️', condition: s => s.totalToolCalls >= 50, xp: 75, category: 'tools' },
  { id: 'two_hundred_tools', name: 'Tool Legend', description: 'Use 200 tools', emoji: '⚡', condition: s => s.totalToolCalls >= 200, xp: 200, category: 'tools' },
  { id: 'thousand_tools', name: 'Tool God', description: 'Use 1,000 tools', emoji: '🔱', condition: s => s.totalToolCalls >= 1000, xp: 500, category: 'tools' },

  // ── Edits ──
  { id: 'ten_edits', name: 'Editor', description: 'Edit 10 files', emoji: '📝', condition: s => s.totalFilesEdited >= 10, xp: 25, category: 'edits' },
  { id: 'fifty_edits', name: 'Code Sculptor', description: 'Edit 50 files', emoji: '🎨', condition: s => s.totalFilesEdited >= 50, xp: 75, category: 'edits' },
  { id: 'two_hundred_edits', name: 'Code Artisan', description: 'Edit 200 files', emoji: '🏛️', condition: s => s.totalFilesEdited >= 200, xp: 200, category: 'edits' },
  { id: 'thousand_edits', name: 'Code Architect', description: 'Edit 1,000 files', emoji: '🏔️', condition: s => s.totalFilesEdited >= 1000, xp: 500, category: 'edits' },

  // ── Bash ──
  { id: 'ten_bash', name: 'Command Line Pro', description: 'Run 10 bash commands', emoji: '⌨️', condition: s => s.totalBashCommands >= 10, xp: 25, category: 'bash' },
  { id: 'fifty_bash', name: 'Shell Wizard', description: 'Run 50 bash commands', emoji: '🧙', condition: s => s.totalBashCommands >= 50, xp: 75, category: 'bash' },
  { id: 'two_hundred_bash', name: 'Terminal God', description: 'Run 200 bash commands', emoji: '⚡', condition: s => s.totalBashCommands >= 200, xp: 200, category: 'bash' },

  // ── Streaks ──
  { id: 'streak_3', name: 'On a Roll', description: '3-day streak', emoji: '🔥', condition: s => s.streak >= 3, xp: 25, category: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', emoji: '⚔️', condition: s => s.streak >= 7, xp: 75, category: 'streak' },
  { id: 'streak_14', name: 'Fortnight Force', description: '14-day streak', emoji: '🛡️', condition: s => s.streak >= 14, xp: 150, category: 'streak' },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', emoji: '🏆', condition: s => s.streak >= 30, xp: 300, category: 'streak' },
  { id: 'streak_90', name: 'Season Veteran', description: '90-day streak', emoji: '🎖️', condition: s => s.streak >= 90, xp: 750, category: 'streak' },
  { id: 'streak_100', name: 'Unstoppable', description: '100-day streak', emoji: '🌟', condition: s => s.streak >= 100, xp: 1000, category: 'streak' },
  { id: 'streak_365', name: 'Year of Code', description: '365-day streak', emoji: '🏅', condition: s => s.streak >= 365, xp: 5000, category: 'streak' },

  // ── Providers ──
  { id: 'provider_3', name: 'Multi-Provider', description: 'Use 3 different providers', emoji: '🌐', condition: s => Object.keys(s.providerUsage).length >= 3, xp: 25, category: 'provider' },
  { id: 'provider_5', name: 'Provider Explorer', description: 'Use 5 different providers', emoji: '🗺️', condition: s => Object.keys(s.providerUsage).length >= 5, xp: 50, category: 'provider' },
  { id: 'provider_10', name: 'Provider Connoisseur', description: 'Use 10 different providers', emoji: '🎯', condition: s => Object.keys(s.providerUsage).length >= 10, xp: 150, category: 'provider' },
  { id: 'provider_20', name: 'Provider Omnivore', description: 'Use 20 different providers', emoji: '🌍', condition: s => Object.keys(s.providerUsage).length >= 20, xp: 300, category: 'provider' },
  { id: 'provider_30', name: 'Provider God', description: 'Use 30 different providers', emoji: '🌌', condition: s => Object.keys(s.providerUsage).length >= 30, xp: 500, category: 'provider' },

  // ── Vibes ──
  { id: 'vibe_3', name: 'Vibe Switcher', description: 'Try 3 different vibes', emoji: '🎭', condition: s => Object.keys(s.vibeUsage).length >= 3, xp: 25, category: 'vibes' },
  { id: 'vibe_5', name: 'Vibe Master', description: 'Try 5 different vibes', emoji: '🌈', condition: s => Object.keys(s.vibeUsage).length >= 5, xp: 50, category: 'vibes' },
  { id: 'vibe_all', name: 'Vibe Chameleon', description: 'Try every vibe', emoji: '🦎', condition: s => Object.keys(s.vibeUsage).length >= 36, xp: 200, category: 'vibes' },

  // ── Combos ──
  { id: 'combo_5', name: 'Combo Starter', description: 'Hit a 5x combo', emoji: '🔥', condition: s => s.maxCombo >= 5, xp: 25, category: 'combo' },
  { id: 'combo_10', name: 'Combo King', description: 'Hit a 10x combo', emoji: '👑', condition: s => s.maxCombo >= 10, xp: 75, category: 'combo' },
  { id: 'combo_25', name: 'Combo Legend', description: 'Hit a 25x combo', emoji: '⚡', condition: s => s.maxCombo >= 25, xp: 200, category: 'combo' },
  { id: 'combo_50', name: 'Combo God', description: 'Hit a 50x combo', emoji: '💎', condition: s => s.maxCombo >= 50, xp: 500, category: 'combo' },

  // ── Levels ──
  { id: 'level_5', name: 'Architect Rising', description: 'Reach level 5', emoji: '🏗️', condition: s => s.level >= 5, xp: 0, category: 'level' },
  { id: 'level_10', name: 'Ascended', description: 'Reach level 10', emoji: '🔮', condition: s => s.level >= 10, xp: 0, category: 'level' },
  { id: 'level_15', name: 'Apotheosis', description: 'Reach max level', emoji: '🌠', condition: s => s.level >= 15, xp: 0, category: 'level' },

  // ── Special ──
  { id: 'free_only', name: 'Free Spirit', description: 'Use only free providers for 50 messages', emoji: '🆓', condition: s => s.totalMessages >= 50 && Object.keys(s.providerUsage).every(p => {
    const freeIds = ['pollinations','llm7','bazaarlink','ovhcloud','gemini','groq','cerebras','deepseek','mistral','cohere','nvidia','githubmodels','huggingface','siliconflow','chutes','glhf','together','fireworks','opencodezen','kilocode','zhipu','alibabastudio','airforce','nscale','nebius','modelscope','ai21','ollama','lmstudio','jan','vllm','llamacpp']
    return freeIds.includes(p)
  }), xp: 100, category: 'special' },
  { id: 'million_tokens', name: 'Million Token Club', description: 'Process 1M+ tokens', emoji: '🎰', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 1000000, xp: 200, category: 'special' },
  { id: 'ten_million_tokens', name: 'Ten Million Token Club', description: 'Process 10M+ tokens', emoji: '🚀', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 10000000, xp: 1000, category: 'special' },
  { id: 'night_owl', name: 'Night Owl', description: 'Use aix after midnight', emoji: '🦉', condition: s => s.totalMessages >= 1, xp: 15, secret: true, category: 'secret' },
  { id: 'early_bird', name: 'Early Bird', description: 'Use aix before 7am', emoji: '🐦', condition: s => s.totalMessages >= 1, xp: 15, secret: true, category: 'secret' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Send 5 messages in one session', emoji: '💨', condition: s => s.messagesThisSession >= 5, xp: 15, category: 'special' },
  { id: 'free_bird', name: 'Free Bird', description: 'Use Pollinations (no key needed)', emoji: '🐦', condition: s => (s.providerUsage['pollinations'] || 0) >= 1, xp: 10, category: 'special' },
  { id: 'local_hero', name: 'Local Hero', description: 'Use a local provider', emoji: '🏠', condition: s => ['ollama','lmstudio','jan','vllm','llamacpp'].some(p => (s.providerUsage[p] || 0) > 0), xp: 25, category: 'special' },
  { id: 'session_10', name: 'Deep Session', description: '10+ messages in one session', emoji: '🏊', condition: s => s.messagesThisSession >= 10, xp: 25, category: 'special' },
  { id: 'session_25', name: 'Marathon Coder', description: '25+ messages in one session', emoji: '🏃', condition: s => s.messagesThisSession >= 25, xp: 75, category: 'special' },
  { id: 'session_50', name: 'Iron Coder', description: '50+ messages in one session', emoji: '🦾', condition: s => s.messagesThisSession >= 50, xp: 200, category: 'special' },
  { id: 'daily_first', name: 'Daily Challenger', description: 'Complete your first daily challenge', emoji: '📅', condition: s => s.dailyChallengeCompleted, xp: 50, category: 'daily' },
  { id: 'all_tools', name: 'Full Toolkit', description: 'Use all 9 tools in one session', emoji: '🧰', condition: s => s.toolsThisSession >= 9, xp: 50, category: 'special' },

  // ── New Tools ──
  { id: 'web_surfer', name: 'Web Surfer', description: 'Use the web_fetch tool', emoji: '🌐', condition: s => s.totalMessages >= 1, xp: 15, category: 'tools' },
  { id: 'git_master', name: 'Git Master', description: 'Use the git_status tool', emoji: '🔀', condition: s => s.totalMessages >= 1, xp: 15, category: 'tools' },
  { id: 'todo_organizer', name: 'Task Organizer', description: 'Use the todo tool', emoji: '📋', condition: s => s.totalMessages >= 1, xp: 15, category: 'tools' },
  { id: 'memory_keeper', name: 'Memory Keeper', description: 'Use the memory tool', emoji: '🧠', condition: s => s.totalMessages >= 1, xp: 15, category: 'tools' },

  // ── Session ──
  { id: 'session_100', name: 'Unstoppable Force', description: '100+ messages in one session', emoji: '🌋', condition: s => s.messagesThisSession >= 100, xp: 500, category: 'special' },
  { id: 'session_200', name: 'Transcendence', description: '200+ messages in one session', emoji: '🧬', condition: s => s.messagesThisSession >= 200, xp: 1000, category: 'special' },

  // ── Vibe Master ──
  { id: 'vibe_10', name: 'Vibe Connoisseur', description: 'Try 10 different vibes', emoji: '🎨', condition: s => Object.keys(s.vibeUsage).length >= 10, xp: 100, category: 'vibes' },
  { id: 'vibe_15', name: 'Vibe Shapeshifter', description: 'Try 15 different vibes', emoji: '🔄', condition: s => Object.keys(s.vibeUsage).length >= 15, xp: 200, category: 'vibes' },
  { id: 'vibe_20', name: 'Vibe Master', description: 'Try 20 different vibes', emoji: '🎭', condition: s => Object.keys(s.vibeUsage).length >= 20, xp: 300, category: 'vibes' },
  { id: 'vibe_25', name: 'Vibe Oracle', description: 'Try 25 different vibes', emoji: '🔮', condition: s => Object.keys(s.vibeUsage).length >= 25, xp: 500, category: 'vibes' },
  { id: 'vibe_30', name: 'Vibe Deity', description: 'Try 30 different vibes', emoji: '✨', condition: s => Object.keys(s.vibeUsage).length >= 30, xp: 750, category: 'vibes' },

  // ── Token Milestones ──
  { id: 'hundred_k_tokens', name: '100K Club', description: 'Process 100K+ tokens', emoji: '📊', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 100000, xp: 50, category: 'special' },
  { id: 'five_million_tokens', name: '5M Club', description: 'Process 5M+ tokens', emoji: '📈', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 5000000, xp: 500, category: 'special' },

  // ── Provider Explorer ──
  { id: 'provider_40', name: 'Provider Deity', description: 'Use 40 different providers', emoji: '🌌', condition: s => Object.keys(s.providerUsage).length >= 40, xp: 750, category: 'provider' },

  // ── Secret ──
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Use aix on a weekend', emoji: '🎉', condition: s => s.totalMessages >= 1, xp: 15, secret: true, category: 'secret' },
  { id: 'midnight_coder', name: 'Midnight Coder', description: 'Code between midnight and 3am', emoji: '🌙', condition: s => s.totalMessages >= 1, xp: 25, secret: true, category: 'secret' },
  { id: 'fifty_sessions', name: 'Session Veteran', description: 'Complete 50 sessions', emoji: '🎖️', condition: s => s.totalSessions >= 50, xp: 100, category: 'special' },
  { id: 'hundred_sessions', name: 'Session Legend', description: 'Complete 100 sessions', emoji: '🏅', condition: s => s.totalSessions >= 100, xp: 250, category: 'special' },
]

export const TITLES: { id: string; name: string; emoji: string; condition: (s: Stats) => boolean }[] = [
  { id: 'newbie', name: 'Newbie', emoji: '🌱', condition: () => true },
  { id: 'free_bird', name: 'Free Bird', emoji: '🆓', condition: s => Object.keys(s.providerUsage).filter(p => !['openai','xai','openrouter','perplexity','sambanova','replicate','novita','custom'].includes(p)).length >= 5 },
  { id: 'hacker', name: 'Hacker', emoji: '🤘', condition: s => s.totalBashCommands >= 50 },
  { id: 'architect', name: 'Architect', emoji: '🏗️', condition: s => s.totalFilesEdited >= 50 },
  { id: 'speedster', name: 'Speedster', emoji: '⚡', condition: s => s.maxCombo >= 10 },
  { id: 'explorer', name: 'Explorer', emoji: '🗺️', condition: s => Object.keys(s.providerUsage).length >= 10 },
  { id: 'vibemaster', name: 'Vibe Master', emoji: '🎭', condition: s => Object.keys(s.vibeUsage).length >= 10 },
  { id: 'streaker', name: 'Streaker', emoji: '🔥', condition: s => s.streak >= 30 },
  { id: 'legend', name: 'Legend', emoji: '💎', condition: s => s.level >= 10 },
  { id: 'god', name: 'God', emoji: '🔱', condition: s => s.level >= 15 },
  { id: 'token_lord', name: 'Token Lord', emoji: '🎰', condition: s => (s.totalTokensIn + s.totalTokensOut) >= 1000000 },
  { id: 'local_only', name: 'Local Only', emoji: '🏠', condition: s => Object.keys(s.providerUsage).every(p => ['ollama','lmstudio','jan','vllm','llamacpp'].includes(p)) && s.totalMessages >= 10 },
  { id: 'vampire', name: 'Night Coder', emoji: '🧛', condition: s => s.totalSessions >= 20 },
  { id: 'combo_queen', name: 'Combo Queen', emoji: '👑', condition: s => s.maxCombo >= 25 },
  { id: 'vibe_chameleon', name: 'Vibe Chameleon', emoji: '🦎', condition: s => Object.keys(s.vibeUsage).length >= 15 },
  { id: 'provider_nomad', name: 'Provider Nomad', emoji: '🚀', condition: s => Object.keys(s.providerUsage).length >= 30 },
  { id: 'session_master', name: 'Session Master', emoji: '🧘', condition: s => s.totalSessions >= 100 },
  { id: 'millionaire', name: 'XP Millionaire', emoji: '💰', condition: s => s.xp >= 100000 },
]

export const DAILY_CHALLENGES: { id: string; name: string; description: string; target: number; xp: number; emoji: string }[] = [
  { id: 'msg5', name: 'Chat Starter', description: 'Send 5 messages today', target: 5, xp: 30, emoji: '💬' },
  { id: 'msg10', name: 'Chatterbox', description: 'Send 10 messages today', target: 10, xp: 60, emoji: '🗣️' },
  { id: 'msg20', name: 'Non-Stop', description: 'Send 20 messages today', target: 20, xp: 120, emoji: '🔥' },
  { id: 'tools5', name: 'Tool Time', description: 'Use 5 tools today', target: 5, xp: 40, emoji: '🔧' },
  { id: 'tools10', name: 'Tool Power', description: 'Use 10 tools today', target: 10, xp: 80, emoji: '🛠️' },
  { id: 'edit3', name: 'Editor', description: 'Edit 3 files today', target: 3, xp: 40, emoji: '✏️' },
  { id: 'edit5', name: 'Heavy Editor', description: 'Edit 5 files today', target: 5, xp: 80, emoji: '📝' },
  { id: 'bash3', name: 'Commander', description: 'Run 3 bash commands today', target: 3, xp: 30, emoji: '🖥️' },
  { id: 'combo5', name: 'Combo Time', description: 'Hit a 5x combo today', target: 5, xp: 50, emoji: '🔥' },
  { id: 'vibe2', name: 'Vibe Hopper', description: 'Try 2 different vibes today', target: 2, xp: 30, emoji: '🎭' },
  { id: 'provider2', name: 'Provider Switch', description: 'Use 2 different providers today', target: 2, xp: 30, emoji: '🌐' },
]

export const WEEKLY_CHALLENGES: { id: string; name: string; description: string; target: number; xp: number; emoji: string }[] = [
  { id: 'w_msg50', name: 'Weekly Chatter', description: 'Send 50 messages this week', target: 50, xp: 200, emoji: '💬' },
  { id: 'w_tools25', name: 'Tool Warrior', description: 'Use 25 tools this week', target: 25, xp: 150, emoji: '🔧' },
  { id: 'w_edit10', name: 'Editor Elite', description: 'Edit 10 files this week', target: 10, xp: 150, emoji: '✏️' },
  { id: 'w_vibe5', name: 'Vibe Explorer', description: 'Try 5 different vibes this week', target: 5, xp: 100, emoji: '🎭' },
  { id: 'w_provider5', name: 'Provider Hopper', description: 'Use 5 different providers this week', target: 5, xp: 100, emoji: '🌐' },
  { id: 'w_combo15', name: 'Combo Master', description: 'Hit a 15x combo this week', target: 15, xp: 200, emoji: '⚡' },
  { id: 'w_streak', name: 'Streak Keeper', description: 'Maintain a 7-day streak', target: 7, xp: 300, emoji: '🔥' },
]

export const QUESTS: { id: string; name: string; description: string; steps: { description: string; target: number }[]; xp: number; emoji: string; requiredLevel: number }[] = [
  { id: 'q_coder', name: 'Coder Journey', description: 'Complete the coder initiation', steps: [{ description: 'Send 5 messages', target: 5 }, { description: 'Use 3 tools', target: 3 }, { description: 'Edit 1 file', target: 1 }], xp: 100, emoji: '🗺️', requiredLevel: 1 },
  { id: 'q_explorer', name: 'Provider Explorer', description: 'Explore the provider ecosystem', steps: [{ description: 'Use 3 different providers', target: 3 }, { description: 'Try 2 different vibes', target: 2 }], xp: 150, emoji: '🧭', requiredLevel: 2 },
  { id: 'q_architect', name: 'Code Architect', description: 'Build your coding foundation', steps: [{ description: 'Edit 10 files', target: 10 }, { description: 'Run 10 bash commands', target: 10 }, { description: 'Use 20 tools', target: 20 }], xp: 300, emoji: '🏗️', requiredLevel: 4 },
  { id: 'q_master', name: 'Mastery Quest', description: 'Achieve coding mastery', steps: [{ description: 'Hit 10x combo', target: 10 }, { description: 'Use 50 tools', target: 50 }, { description: 'Edit 50 files', target: 50 }], xp: 500, emoji: '👑', requiredLevel: 6 },
  { id: 'q_legend', name: 'Legend Quest', description: 'Become a legend', steps: [{ description: 'Reach level 10', target: 10 }, { description: 'Complete 5 daily challenges', target: 5 }, { description: 'Try 15 vibes', target: 15 }], xp: 1000, emoji: '💎', requiredLevel: 8 },
]

export function loadStats(): Stats {
  if (!existsSync(STATS_FILE)) {
    return {
      xp: 0, level: 1, streak: 0, lastUsed: '', totalMessages: 0,
      totalToolCalls: 0, totalFilesEdited: 0, totalBashCommands: 0,
      totalTokensIn: 0, totalTokensOut: 0, totalSessions: 0,
      achievements: [], providerUsage: {}, vibeUsage: {},
      createdAt: new Date().toISOString(),
      combo: 0, maxCombo: 0, lastMessageTime: 0, totalCombos: 0,
      dailyChallenge: null, dailyChallengeDate: null, dailyChallengeProgress: 0, dailyChallengeCompleted: false,
      activeTitle: null, unlockedTitles: ['newbie'],
      messagesThisSession: 0, toolsThisSession: 0, editsThisSession: 0,
      powerUpActive: null, powerUpExpires: 0,
      weeklyChallenge: null, weeklyChallengeDate: null, weeklyChallengeProgress: 0, weeklyChallengeCompleted: false,
      activeQuests: [], completedQuests: [],
    }
  }
  try {
    const s = JSON.parse(readFileSync(STATS_FILE, 'utf-8'))
    // Ensure new fields exist
    s.combo = s.combo || 0
    s.maxCombo = s.maxCombo || 0
    s.lastMessageTime = s.lastMessageTime || 0
    s.totalCombos = s.totalCombos || 0
    s.dailyChallenge = s.dailyChallenge || null
    s.dailyChallengeDate = s.dailyChallengeDate || null
    s.dailyChallengeProgress = s.dailyChallengeProgress || 0
    s.dailyChallengeCompleted = s.dailyChallengeCompleted || false
    s.activeTitle = s.activeTitle || null
    s.unlockedTitles = s.unlockedTitles || ['newbie']
    s.messagesThisSession = 0
    s.toolsThisSession = 0
    s.editsThisSession = 0
    s.powerUpActive = s.powerUpActive || null
    s.powerUpExpires = s.powerUpExpires || 0
    s.weeklyChallenge = s.weeklyChallenge || null
    s.weeklyChallengeDate = s.weeklyChallengeDate || null
    s.weeklyChallengeProgress = s.weeklyChallengeProgress || 0
    s.weeklyChallengeCompleted = s.weeklyChallengeCompleted || false
    s.activeQuests = s.activeQuests || []
    s.completedQuests = s.completedQuests || []
    return s
  } catch {
    return {
      xp: 0, level: 1, streak: 0, lastUsed: '', totalMessages: 0,
      totalToolCalls: 0, totalFilesEdited: 0, totalBashCommands: 0,
      totalTokensIn: 0, totalTokensOut: 0, totalSessions: 0,
      achievements: [], providerUsage: {}, vibeUsage: {},
      createdAt: new Date().toISOString(),
      combo: 0, maxCombo: 0, lastMessageTime: 0, totalCombos: 0,
      dailyChallenge: null, dailyChallengeDate: null, dailyChallengeProgress: 0, dailyChallengeCompleted: false,
      activeTitle: null, unlockedTitles: ['newbie'],
      messagesThisSession: 0, toolsThisSession: 0, editsThisSession: 0,
      powerUpActive: null, powerUpExpires: 0,
      weeklyChallenge: null, weeklyChallengeDate: null, weeklyChallengeProgress: 0, weeklyChallengeCompleted: false,
      activeQuests: [], completedQuests: [],
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
    if (xp >= level.xpRequired) result = level
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
  // Check titles
  for (const title of TITLES) {
    if (!stats.unlockedTitles.includes(title.id) && title.condition(stats)) {
      stats.unlockedTitles.push(title.id)
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
    if (diffDays === 1) stats.streak++
    else if (diffDays > 1) stats.streak = 1
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
  return { leveledUp: newLevel.level > oldLevel.level, newLevel, oldLevel }
}

export function updateCombo(stats: Stats): { combo: number; comboMultiplier: number; isNewRecord: boolean } {
  const now = Date.now()
  const timeSinceLast = now - stats.lastMessageTime
  // Combo window: 2 minutes
  if (timeSinceLast < 120000 && stats.lastMessageTime > 0) {
    stats.combo++
    stats.totalCombos++
  } else {
    stats.combo = 1
  }
  stats.lastMessageTime = now
  const isNewRecord = stats.combo > stats.maxCombo
  if (isNewRecord) stats.maxCombo = stats.combo
  const comboMultiplier = stats.combo >= 10 ? 2.0 : stats.combo >= 5 ? 1.5 : stats.combo >= 3 ? 1.25 : 1.0
  return { combo: stats.combo, comboMultiplier, isNewRecord }
}

export function assignDailyChallenge(stats: Stats): void {
  const today = new Date().toISOString().split('T')[0]
  if (stats.dailyChallengeDate === today && stats.dailyChallenge) return
  // Pick a random challenge based on day
  const dayIndex = new Date().getDate() + new Date().getMonth() * 31
  const challenge = DAILY_CHALLENGES[dayIndex % DAILY_CHALLENGES.length]
  stats.dailyChallenge = challenge.id
  stats.dailyChallengeDate = today
  stats.dailyChallengeProgress = 0
  stats.dailyChallengeCompleted = false
}

export function getDailyChallenge(stats: Stats): { id: string; name: string; description: string; target: number; xp: number; emoji: string; progress: number; completed: boolean } | null {
  if (!stats.dailyChallenge) return null
  const challenge = DAILY_CHALLENGES.find(c => c.id === stats.dailyChallenge)
  if (!challenge) return null
  return { ...challenge, progress: stats.dailyChallengeProgress, completed: stats.dailyChallengeCompleted }
}

export function updateDailyChallenge(stats: Stats, type: 'message' | 'tool' | 'edit' | 'bash' | 'combo' | 'vibe' | 'provider'): void {
  if (stats.dailyChallengeCompleted) return
  stats.dailyChallengeProgress++
  const challenge = DAILY_CHALLENGES.find(c => c.id === stats.dailyChallenge)
  if (challenge && stats.dailyChallengeProgress >= challenge.target) {
    stats.dailyChallengeCompleted = true
    stats.xp += challenge.xp
  }
}

export function renderXpBar(stats: Stats, width: number = 20): string {
  const { current, next, xpNeeded } = getXpForNextLevel(stats.level)
  if (xpNeeded === 0) return `${'█'.repeat(width)} MAX`
  const progress = (stats.xp - current) / (next - current)
  const filled = Math.round(progress * width)
  const empty = width - filled
  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${stats.xp - current}/${xpNeeded} XP`
}

export function renderStats(stats: Stats): string {
  const level = getLevelForXp(stats.xp)
  const title = stats.activeTitle ? TITLES.find(t => t.id === stats.activeTitle) : null
  const titleStr = title ? ` ${title.emoji} ${title.name}` : ''
  const lines: string[] = []
  lines.push(`  ${level.color}${level.emoji} Level ${level.level}: ${level.name}${titleStr}${'\x1b[0m'}`)
  lines.push(`  ${level.color}${level.title}${'\x1b[0m'}`)
  lines.push(`  ${renderXpBar(stats)}`)
  lines.push('')
  lines.push(`  💬 Messages: ${stats.totalMessages}  🔧 Tools: ${stats.totalToolCalls}  ✏️ Edits: ${stats.totalFilesEdited}`)
  lines.push(`  🖥️ Commands: ${stats.totalBashCommands}  🔥 Streak: ${stats.streak} days  ⚡ Max Combo: ${stats.maxCombo}x`)
  lines.push(`  🪙 Total XP: ${stats.xp}  🏆 Achievements: ${stats.achievements.length}/${ACHIEVEMENTS.length}`)
  const totalTokens = stats.totalTokensIn + stats.totalTokensOut
  if (totalTokens > 0) {
    lines.push(`  📊 Tokens: ${(totalTokens / 1000).toFixed(0)}K total`)
  }
  return lines.join('\n')
}

export function renderAchievementUnlock(achievement: Achievement): string {
  const lines: string[] = []
  lines.push('')
  lines.push('  ╔══════════════════════════════════════════╗')
  lines.push('  ║  🏆 ACHIEVEMENT UNLOCKED!                ║')
  lines.push(`  ║  ${achievement.emoji} ${achievement.name.padEnd(35)}║`)
  lines.push(`  ║  ${achievement.description.padEnd(39)}║`)
  lines.push(`  ║  +${String(achievement.xp).padEnd(3)} XP${' '.repeat(31)}║`)
  lines.push('  ╚══════════════════════════════════════════╝')
  lines.push('')
  return lines.join('\n')
}

export function renderLevelUp(oldLevel: Level, newLevel: Level): string {
  const lines: string[] = []
  lines.push('')
  lines.push('  ╔══════════════════════════════════════════════╗')
  lines.push('  ║  ⬆️  LEVEL UP!                                ║')
  lines.push(`  ║  ${oldLevel.emoji} Lv.${oldLevel.level} ${oldLevel.name}`)
  lines.push('  ║  ────────────────►')
  lines.push(`  ║  ${newLevel.emoji} Lv.${newLevel.level} ${newLevel.name}`)
  lines.push(`  ║  ${newLevel.title}`)
  lines.push('  ╚══════════════════════════════════════════════╝')
  lines.push('')
  return lines.join('\n')
}

export function renderCombo(combo: number, multiplier: number): string {
  if (combo < 3) return ''
  const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', yellow: '\x1b[33m', red: '\x1b[91m',
    brightYellow: '\x1b[93m', brightCyan: '\x1b[96m', brightMagenta: '\x1b[95m',
  }
  const comboColor = combo >= 10 ? C.brightMagenta : combo >= 5 ? C.brightYellow : C.yellow
  const multiplierStr = multiplier > 1 ? ` ${C.brightCyan}×${multiplier}${C.reset}` : ''
  return `${comboColor}${C.bold} ⚡ ${combo}x COMBO!${C.reset}${multiplierStr}`
}

export function renderDailyChallenge(stats: Stats): string {
  const challenge = getDailyChallenge(stats)
  if (!challenge) return ''
  const C = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m' }
  const status = challenge.completed ? `${C.green}✓ COMPLETE${C.reset}` : `${challenge.progress}/${challenge.target}`
  const bar_width = 15
  const progress = Math.min(challenge.progress / challenge.target, 1)
  const filled = Math.round(progress * bar_width)
  const bar = `${'█'.repeat(filled)}${'░'.repeat(bar_width - filled)}`
  return `  ${C.cyan}📅 Daily:${C.reset} ${challenge.emoji} ${challenge.name} ${C.dim}[${bar}]${C.reset} ${status} ${C.dim}(+${challenge.xp} XP)${C.reset}`
}

export function assignWeeklyChallenge(stats: Stats): void {
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString().split('T')[0]
  if (stats.weeklyChallengeDate === weekStart && stats.weeklyChallenge) return
  const weekIndex = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
  const challenge = WEEKLY_CHALLENGES[weekIndex % WEEKLY_CHALLENGES.length]
  stats.weeklyChallenge = challenge.id
  stats.weeklyChallengeDate = weekStart
  stats.weeklyChallengeProgress = 0
  stats.weeklyChallengeCompleted = false
}

export function renderWeeklyChallenge(stats: Stats): string {
  if (!stats.weeklyChallenge) return ''
  const challenge = WEEKLY_CHALLENGES.find(c => c.id === stats.weeklyChallenge)
  if (!challenge) return ''
  const C = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', brightMagenta: '\x1b[95m' }
  const status = stats.weeklyChallengeCompleted ? `${C.green}✓ COMPLETE${C.reset}` : `${stats.weeklyChallengeProgress}/${challenge.target}`
  const bar_width = 15
  const progress = Math.min(stats.weeklyChallengeProgress / challenge.target, 1)
  const filled = Math.round(progress * bar_width)
  const bar = `${'█'.repeat(filled)}${'░'.repeat(bar_width - filled)}`
  return `  ${C.brightMagenta}📅 Weekly:${C.reset} ${challenge.emoji} ${challenge.name} ${C.dim}[${bar}]${C.reset} ${status} ${C.dim}(+${challenge.xp} XP)${C.reset}`
}

export function renderQuests(stats: Stats): string {
  const C = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', brightYellow: '\x1b[93m', brightCyan: '\x1b[96m' }
  const lines: string[] = []
  lines.push('')
  lines.push(`  ${C.bold}${C.brightYellow}🗺️ Quests${C.reset}`)
  lines.push('')
  for (const q of QUESTS) {
    const completed = stats.completedQuests.includes(q.id)
    const available = !completed && q.requiredLevel <= stats.level
    const status = completed ? `${C.green}✓ DONE${C.reset}` : available ? `${C.brightCyan}Available${C.reset}` : `${C.dim}🔒 Lv.${q.requiredLevel}${C.reset}`
    lines.push(`  ${status} ${q.emoji} ${C.bold}${q.name}${C.reset} — ${q.description}`)
    lines.push(`  ${C.dim}  Reward: +${q.xp} XP${C.reset}`)
    if (available && !completed) {
      const stepLines = q.steps.map((s, i) => `  ${C.dim}  ${i + 1}. ${s.description}${C.reset}`)
      lines.push(...stepLines)
    }
  }
  return lines.join('\n')
}
