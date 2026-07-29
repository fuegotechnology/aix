import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'

const AIX_DIR = resolve(homedir(), '.aix')
const USER_CONFIG_FILE = join(AIX_DIR, 'config.json')

export interface AixConfig {
  // Default settings
  defaultProvider: string | null
  defaultModel: string | null
  defaultVibe: string | null
  defaultMaxTurns: number
  defaultTemperature: number | null

  // Behavior
  autoFallback: boolean
  autoCompact: boolean
  compactThreshold: number  // messages before compacting
  verbose: boolean
  noTools: boolean

  // Advanced
  maxHistoryMessages: number
  providerTimeout: number  // ms
  retryAttempts: number
  retryDelay: number      // ms

  // Custom system prompt additions
  systemPromptExtra: string | null

  // Macros
  macros: Record<string, string>

  // Ignore patterns
  ignorePatterns: string[]
}

export const DEFAULT_CONFIG: AixConfig = {
  defaultProvider: null,
  defaultModel: null,
  defaultVibe: null,
  defaultMaxTurns: 20,
  defaultTemperature: null,
  autoFallback: true,
  autoCompact: true,
  compactThreshold: 30,
  verbose: false,
  noTools: false,
  maxHistoryMessages: 40,
  providerTimeout: 30000,
  retryAttempts: 2,
  retryDelay: 1000,
  systemPromptExtra: null,
  macros: {},
  ignorePatterns: [],
}

export function loadConfig(): AixConfig {
  // Start with defaults
  const config = { ...DEFAULT_CONFIG }

  // Load user config
  if (existsSync(USER_CONFIG_FILE)) {
    try {
      const userConfig = JSON.parse(readFileSync(USER_CONFIG_FILE, 'utf-8'))
      Object.assign(config, userConfig)
    } catch { /* use defaults */ }
  }

  // Load project config
  const projectConfigPath = resolve(process.cwd(), '.aix', 'config.json')
  if (existsSync(projectConfigPath)) {
    try {
      const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf-8'))
      Object.assign(config, projectConfig)
    } catch { /* use user config */ }
  }

  // Ensure macros object exists
  if (!config.macros) config.macros = {}

  return config
}

export function saveConfig(config: AixConfig): void {
  mkdirSync(AIX_DIR, { recursive: true })
  writeFileSync(USER_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function getConfigValue<K extends keyof AixConfig>(key: K): AixConfig[K] {
  return loadConfig()[key]
}

export function setConfigValue<K extends keyof AixConfig>(key: K, value: AixConfig[K]): void {
  const config = loadConfig()
  config[key] = value
  saveConfig(config)
}

export function renderConfig(config: AixConfig): string {
  const lines: string[] = []
  lines.push('  ╔══════════════════════════════════════════════╗')
  lines.push('  ║  ⚙️  aix Configuration                        ║')
  lines.push('  ╚══════════════════════════════════════════════╝')
  lines.push('')
  lines.push(`  Provider:      ${config.defaultProvider || '(auto-detect)'}`)
  lines.push(`  Model:         ${config.defaultModel || '(provider default)'}`)
  lines.push(`  Vibe:          ${config.defaultVibe || '(default)'}`)
  lines.push(`  Max Turns:     ${config.defaultMaxTurns}`)
  lines.push(`  Temperature:   ${config.defaultTemperature ?? '(default)'}`)
  lines.push(`  Auto Fallback: ${config.autoFallback ? '✓ on' : '✗ off'}`)
  lines.push(`  Auto Compact:  ${config.autoCompact ? '✓ on' : '✗ off'}`)
  lines.push(`  Compact at:    ${config.compactThreshold} messages`)
  lines.push(`  Retry:         ${config.retryAttempts} attempts, ${config.retryDelay}ms delay`)
  lines.push(`  History Limit: ${config.maxHistoryMessages} messages`)
  lines.push(`  Verbose:       ${config.verbose ? '✓ on' : '✗ off'}`)
  if (config.systemPromptExtra) {
    lines.push(`  Custom Prompt: ${config.systemPromptExtra.slice(0, 60)}...`)
  }
  const macroKeys = Object.keys(config.macros || {})
  if (macroKeys.length > 0) {
    lines.push(`  Macros:        ${macroKeys.join(', ')}`)
  }
  lines.push('')
  lines.push(`  Config file: ${USER_CONFIG_FILE}`)
  lines.push(`  Project config: ${resolve(process.cwd(), '.aix', 'config.json')}`)
  return lines.join('\n')
}
