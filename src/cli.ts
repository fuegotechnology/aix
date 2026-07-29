import { resolve, join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { providers, getProvider, detectProvider, getApiKey, resolveModel, FREE_PROVIDER_IDS, FREE_NO_KEY_IDS, getFallbackProvider } from './providers.js'
import type { Provider } from './providers.js'
import { runAgent, type AgentChunk, type Message } from './agent.js'
import { buildSystemPrompt } from './system-prompt.js'
import { getVibe, getVibeNames, VIBES } from './vibes.js'
import type { Vibe } from './vibes.js'
import {
  loadStats, saveStats, updateStreak, addXp, checkNewAchievements,
  getLevelForXp, renderXpBar, renderStats, renderAchievementUnlock, renderLevelUp,
  renderCombo, renderDailyChallenge, updateCombo, assignDailyChallenge, updateDailyChallenge,
  assignWeeklyChallenge, renderWeeklyChallenge, renderQuests,
  LEVELS, ACHIEVEMENTS, TITLES, DAILY_CHALLENGES, WEEKLY_CHALLENGES, QUESTS,
} from './gamification.js'
import type { Stats } from './gamification.js'
import {
  bold, dim, red, green, yellow, cyan, gray, magenta, brightCyan, brightGreen,
  providerBadge, toolBadge, successLine, errorLine, infoLine, warningLine,
  divider, keyValue,
  Spinner, renderMarkdown, printBanner, printTokens, printTurnInfo, prompt,
  renderAction,
} from './ui.js'
import { loadConfig, saveConfig, renderConfig, type AixConfig } from './config.js'
import { checkAllNoKeyProviders, renderHealthResults, getBestProvider } from './health.js'
import { activatePowerUp, renderPowerUps, renderMacros, saveExport, POWER_UPS, getTimeGreeting } from './advanced.js'

const AIX_DIR = resolve(homedir(), '.aix')
const SESSIONS_DIR = join(AIX_DIR, 'sessions')

function printHelp(): void {
  const version = process.env.AIX_VERSION || '1.0.0'
  const freeNoKeyCount = FREE_NO_KEY_IDS.length
  console.log(`
${bold(`◆ aix v${version}`)} — AI coding assistant for your terminal

${bold(cyan('USAGE'))}
  ${bold('aix')} [options]                    Interactive mode (default)
  ${bold('aix')} "your prompt"                One-shot mode (positional)
  ${bold('aix')} -e "your prompt"             One-shot mode (explicit)

${bold(cyan('OPTIONS'))}
  ${bold('-h, --help')}                   Show this help
  ${bold('-v, --version')}                Show version
  ${bold('--providers')}                  List all providers
  ${bold('-p, --provider <id>')}          Use a specific provider
  ${bold('-m, --model <name>')}           Set model (also via AIX_MODEL env)
  ${bold('--vibe <id>')}                  Set vibe mode (default, hacker, pirate, wizard, zen, fire, gamer, noir, creative, bro, robot, shakespeare, cowboy, anime, chef, scientist, medieval, surfer, philosopher, rapper, beach, vampire, alien, yoda, mobster, disco, synthwave, goth, memelord, kawaii, retro, cyberpunk, underwater, space, jungle, winter, detective, monk, punk, samurai)
  ${bold('--no-tools')}                   Disable tool use
  ${bold('-e, --exec <prompt>')}          One-shot mode
  ${bold('--max-turns <n>')}              Max agent turns (default: 20)
  ${bold('--temperature <n>')}            Set temperature (0.0 - 2.0)
  ${bold('--verbose')}                    Show detailed tool output
  ${bold('--quiet')}                      Minimal output (errors only)
  ${bold('--stats')}                      Show your stats and achievements
  ${bold('--leaderboard')}                Show XP leaderboard
  ${bold('--reset-stats')}                Reset all stats
  ${bold('--fallback')}                   Auto-fallback to another free provider on failure
  ${bold('--health')}                     Check which free providers are working
  ${bold('--config')}                     View current configuration
  ${bold('--best')}                       Auto-select the fastest free provider

${bold(cyan('VIBES'))} 🎭
  ${bold('default')}     🎯  Professional — clean, focused
  ${bold('hacker')}      🤘  Hacker — green-on-black, l33t
  ${bold('pirate')}      🏴‍☠️  Pirate — arrr, matey!
  ${bold('wizard')}      🧙  Wizard — mystical coding wisdom
  ${bold('zen')}         🧘  Zen — calm, minimal, peaceful
  ${bold('fire')}        🔥  Fire — hyped, energetic!
  ${bold('gamer')}       🎮  Gamer — XP, quests, boss fights
  ${bold('noir')}        🕵️  Noir — dark, gritty detective
  ${bold('creative')}    🎨  Creative — colorful, enthusiastic
  ${bold('bro')}         😎  Bro — casual, chill energy
  ${bold('robot')}       🤖  Robot — beep boop, precision
  ${bold('shakespeare')} 🎭  Shakespeare — forsooth, iambic code!
  ${bold('cowboy')}      🤠  Cowboy — yeehaw, saddle up!
  ${bold('anime')}       ⚡  Anime — nani?! power up!
  ${bold('chef')}        👨‍🍳  Chef — let's cook some code!
  ${bold('scientist')}   🔬  Scientist — empirical, precise
  ${bold('medieval')}    ⚔️  Medieval — knight of the code
  ${bold('surfer')}      🏄  Surfer — catch the wave, dude!
  ${bold('philosopher')} 🤔  Philosopher — deep thoughts
  ${bold('rapper')}      🎤  Rapper — drop bars, ship code
  ${bold('beach')}       🏖️  Beach — tropical vibes, code under the palms
  ${bold('vampire')}     🧛  Vampire — dark, ancient, eternally debugging
  ${bold('alien')}       👽  Alien — take me to your codebase!
  ${bold('yoda')}        🟢  Yoda — code, you must. Wise, you will become.
  ${bold('mobster')}     🤵  Mobster — an offer you can't refuse
  ${bold('disco')}       🪩  Disco — stayin' alive in code!
  ${bold('synthwave')}   🌆  Synthwave — neon lights, retro futures
  ${bold('goth')}        🖤  Goth — dark, moody, beautiful code
  ${bold('memelord')}    🐸  Meme Lord — much code, very wow
  ${bold('kawaii')}      🌸  Kawaii — super cute, pastel, adorable code!
  ${bold('retro')}       👾  Retro — 8-bit, pixel art, old school
  ${bold('cyberpunk')}  🦾  Cyberpunk — neon-soaked streets, chrome
  ${bold('underwater')} 🐙  Underwater — deep sea coding
  ${bold('space')}      🚀  Space — final frontier, cosmic coding
  ${bold('jungle')}     🌴  Jungle — wild code in the untamed
  ${bold('winter')}     ❄️  Winter — frozen code, snowflakes
  ${bold('detective')}  🔍  Detective — investigating code crimes
  ${bold('monk')}       📿  Monk — calm, disciplined, minimal
  ${bold('punk')}       🎸  Punk — break the rules, anarchy!
  ${bold('samurai')}    ⚔️  Samurai — honor, discipline, the way

${bold(cyan('INTERACTIVE COMMANDS'))}
  ${bold('/exit')}, ${bold('/quit')}             Exit aix
  ${bold('/clear')}                      Clear conversation history
  ${bold('/help')}                       Show help
  ${bold('/providers')}                  List providers
  ${bold('/model <name>')}               Switch model
  ${bold('/provider <id>')}              Switch provider
  ${bold('/vibe <id>')}                  Switch vibe mode
  ${bold('/vibes')}                      List all vibes
  ${bold('/history')}                    Show conversation history
  ${bold('/context')}                    Show project context
  ${bold('/tools')}                      List available tools
  ${bold('/retry')}                      Retry last message
  ${bold('/compact')}                    Compact conversation history
  ${bold('/stats')}                      Show your stats
  ${bold('/achievements')}              Show achievements
  ${bold('/daily')}                      Show daily challenge
  ${bold('/title')}                      Set your title
  ${bold('/save')}                       Save current session
  ${bold('/load')}                       Load a saved session
  ${bold('/fallback')}                   Switch to a different free provider
  ${bold('/config')}                     View/edit configuration
  ${bold('/health')}                     Check provider health
  ${bold('/powerup')}                    View and activate power-ups
  ${bold('/export')}                     Export conversation to markdown
  ${bold('/macro')}                      Manage macros
  ${bold('/quest')}                      View and manage quests
  ${bold('/weekly')}                     Show weekly challenge

${bold(cyan('ENVIRONMENT VARIABLES'))}
  ${bold('AIX_PROVIDER')}                Provider id to use
  ${bold('AIX_MODEL')}                   Model name override
  ${bold('AIX_VIBE')}                    Vibe mode (default, hacker, pirate, etc.)
  ${bold('AIX_BASE_URL')}                Custom endpoint base URL
  ${bold('AIX_API_KEY')}                 Custom endpoint API key
  ${bold('AIX_MAX_TURNS')}               Max agent turns (default: 20)
  ${bold('AIX_NO_TOOLS')}                Set to "1" to disable tools

${bold(cyan('FREE PROVIDERS'))} ${brightGreen(`(${freeNoKeyCount} no-key providers!)`)}
  ${brightGreen('pollinations')}    No key — GPT-4o, DeepSeek, Gemini, Qwen
  ${brightGreen('llm7')}            No key — GPT-4o, Gemini, DeepSeek
  ${brightGreen('bazaarlink')}      No key — Auto Free (zero-cost inference)
  ${brightGreen('ovhcloud')}        No key — Llama 3.3 70B, Mistral, Qwen Coder
  ${dim('... plus 23 free-tier providers and 6 local! Run aix --providers to see all')}

${bold(cyan('EXAMPLES'))}
  ${dim('# Zero setup — completely free')}
  aix -p pollinations "hello"
  aix -p llm7 "write a hello world"

  ${dim('# With vibes!')}
  aix --vibe hacker "hack the mainframe"
  aix --vibe pirate "find the treasure in this code"
  aix --vibe wizard "cast a spell on this bug"

  ${dim('# Free API key')}
  AIX_USE_GEMINI=1 aix "explain this code"
  aix -p groq -m llama-3.3-70b-versatile "fix the bug"

  ${dim('# Local models')}
  aix -p ollama "what is this project?"
`)
}

function printProviders(): void {
  const freeNoKey = providers.filter(p => p.free && !p.local && !p.apiKeyEnv)
  const freeTier = providers.filter(p => p.free && !p.local && p.apiKeyEnv)
  const paid = providers.filter(p => !p.free && !p.local)
  const local = providers.filter(p => p.local)

  const printGroup = (title: string, list: Provider[], emoji: string) => {
    console.log(`\n${bold(cyan(title))} ${dim(`(${list.length} providers)`)}`)
    console.log(divider('─', 70))
    for (const p of list) {
      const key = p.apiKeyEnv ? gray(`(${p.apiKeyEnv})`) : gray('(no key needed)')
      console.log(`  ${bold(p.id.padEnd(16))} ${p.name.padEnd(22)} ${key}`)
      if (p.description) {
        console.log(`  ${''.padEnd(16)} ${dim(p.description.slice(0, 60))}`)
      }
    }
  }

  console.log()
  console.log(`  ${bold(`◆ aix — Supported Providers`)} ${dim(`(${providers.length} total)`)}`)
  console.log(`  ${brightGreen(`${freeNoKey.length} completely free (no key) │ ${freeTier.length} free tier │ ${paid.length} paid │ ${local.length} local`)}`)
  printGroup(`🆓 FREE — No API Key Needed (just works!)`, freeNoKey, '🆓')
  printGroup(`🆓 FREE — Free API Key (no credit card)`, freeTier, '🆓')
  printGroup(`💳 PAID — Requires Payment`, paid, '💳')
  printGroup(`🏠 LOCAL — Self-Hosted (always free)`, local, '🏠')

  console.log()
  console.log(`  ${bold('Quick Start')}`)
  console.log()
  console.log(`  ${brightGreen('No setup:')}   aix -p pollinations "hello"`)
  console.log(`  ${brightGreen('Vibes:')}     aix --vibe hacker "explain this code"`)
  console.log(`  ${brightGreen('Free key:')}    AIX_USE_GEMINI=1 aix "explain this code"`)
  console.log(`  ${brightGreen('Local:')}      aix -p ollama "what is this project?"`)
  console.log()
}

function printStats(stats: Stats): void {
  console.log()
  console.log(`  ${bold('◆ Your aix Stats')}`)
  console.log()
  console.log(renderStats(stats))
  console.log()
}

function printAchievements(stats: Stats): void {
  console.log()
  console.log(`  ${bold('🏆 Achievements')} ${dim(`(${stats.achievements.length}/${ACHIEVEMENTS.length})`)}`)
  console.log()
  for (const a of ACHIEVEMENTS) {
    const unlocked = stats.achievements.includes(a.id)
    if (a.secret && !unlocked) continue
    const status = unlocked ? brightGreen('✓') : dim('○')
    const name = unlocked ? bold(a.name) : dim(a.name)
    const desc = unlocked ? a.description : dim(a.description)
    console.log(`  ${status} ${a.emoji} ${name} — ${desc} ${unlocked ? green(`(+${a.xp} XP)`) : dim(`(+${a.xp} XP)`)}`)
  }
  console.log()
}

function printVibes(): void {
  console.log()
  console.log(`  ${bold('🎭 Vibe Modes')}`)
  console.log()
  for (const v of VIBES) {
    console.log(`  ${v.emoji}  ${bold(v.id.padEnd(12))} ${v.name.padEnd(14)} — ${dim(v.description)}`)
  }
  console.log()
  console.log(`  ${dim('Switch vibes: /vibe <id> or aix --vibe <id>')}`)
  console.log()
}

async function runInteractive(provider: Provider, cwd: string, noTools: boolean, verbose: boolean, vibe: Vibe): Promise<void> {
  const model = resolveModel(provider)
  const apiKey = getApiKey(provider)
  printBanner(provider.name, model, cwd)

  // Show vibe greeting
  console.log(`  ${vibe.emoji} ${vibe.colors.primary}${vibe.greeting}${'\x1b[0m'}`)

  // Show time-aware greeting
  console.log(`  ${dim(getTimeGreeting())}`)
  console.log()

  // Load and show stats
  const stats = loadStats()
  updateStreak(stats)
  assignDailyChallenge(stats)
  assignWeeklyChallenge(stats)
  stats.totalSessions++
  stats.providerUsage[provider.id] = (stats.providerUsage[provider.id] || 0) + 1
  stats.vibeUsage[vibe.id] = (stats.vibeUsage[vibe.id] || 0) + 1
  saveStats(stats)

  const level = getLevelForXp(stats.xp)
  console.log(`  ${level.emoji} ${level.color}Level ${level.level}: ${level.name}${'\x1b[0m'} ${dim(renderXpBar(stats))}`)
  const dailyDisplay = renderDailyChallenge(stats)
  if (dailyDisplay) console.log(dailyDisplay)
  const weeklyDisplay = renderWeeklyChallenge(stats)
  if (weeklyDisplay) console.log(weeklyDisplay)
  console.log()

  const history: Message[] = []
  let currentProvider = provider
  let currentModel = model
  let currentVibe = vibe
  let lastUserMessage = ''
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${currentVibe.colors.prompt}${currentVibe.emoji} ❯${'\x1b[0m'} `,
  })
  rl.prompt()

  rl.on('line', async (line: string) => {
    const input = line.trim()
    if (!input) {
      rl.prompt()
      return
    }

    // Handle slash commands
    if (input.startsWith('/')) {
      const parts = input.split(/\s+/)
      const cmd = parts[0].toLowerCase()
      const arg = parts.slice(1).join(' ')

      switch (cmd) {
        case '/exit':
        case '/quit':
          console.log(`  ${currentVibe.emoji} ${currentVibe.colors.primary}${currentVibe.farewell}${'\x1b[0m'}`)
          // Save stats
          saveStats(stats)
          rl.close()
          process.exit(0)
        case '/clear':
          history.length = 0
          console.log(successLine('History cleared'))
          rl.prompt()
          return
        case '/help':
          printHelp()
          rl.prompt()
          return
        case '/providers':
          printProviders()
          rl.prompt()
          return
        case '/model':
          if (arg) {
            currentModel = arg
            process.env.AIX_MODEL = arg
            console.log(successLine(`Model set to ${brightCyan(arg)}`))
          } else {
            console.log(infoLine(`Current model: ${brightCyan(currentModel)}`))
          }
          rl.prompt()
          return
        case '/provider':
          if (arg) {
            const p = getProvider(arg)
            if (p) {
              currentProvider = p
              currentModel = resolveModel(p)
              stats.providerUsage[p.id] = (stats.providerUsage[p.id] || 0) + 1
              saveStats(stats)
              console.log(successLine(`Provider: ${p.name} │ Model: ${brightCyan(currentModel)}`))
            } else {
              console.log(errorLine(`Unknown provider: ${arg}`))
            }
          } else {
            console.log(infoLine(`Current provider: ${currentProvider.name} │ Model: ${brightCyan(currentModel)}`))
          }
          rl.prompt()
          return
        case '/vibe':
          if (arg) {
            const v = getVibe(arg)
            currentVibe = v
            stats.vibeUsage[v.id] = (stats.vibeUsage[v.id] || 0) + 1
            saveStats(stats)
            rl.setPrompt(`${currentVibe.colors.prompt}${currentVibe.emoji} ❯${'\x1b[0m'} `)
            console.log(`  ${v.emoji} ${v.colors.primary}${v.greeting}${'\x1b[0m'}`)
          } else {
            console.log(infoLine(`Current vibe: ${currentVibe.emoji} ${currentVibe.name}`))
          }
          rl.prompt()
          return
        case '/vibes':
          printVibes()
          rl.prompt()
          return
        case '/history':
          console.log(infoLine(`${history.length} messages in history (max 40)`))
          rl.prompt()
          return
        case '/context':
          const sp = buildSystemPrompt(cwd)
          console.log(dim(sp.slice(0, 500) + '...'))
          rl.prompt()
          return
          case '/tools':
            console.log(bold(cyan('Coding Tools:')))
            console.log('  • read_file    — Read file contents with line numbers')
            console.log('  • write_file   — Create or overwrite files')
            console.log('  • edit_file    — Find and replace text in files')
            console.log('  • bash         — Run shell commands')
            console.log('  • list_files   — List files and directories')
            console.log('  • search_files — Search across files with regex')
            console.log('  • glob_find    — Find files matching a pattern')
            console.log('  • tree         — Display directory tree')
            console.log('  • diagnose     — Run project diagnostics')
            console.log('  • web_fetch    — Fetch content from a URL')
            console.log('  • git_status   — Show git status and recent commits')
            console.log('  • env_info     — Show environment information')
            console.log('  • todo         — Manage a session todo list')
            console.log('  • diff_view    — Show uncommitted changes')
            console.log('  • memory       — Save/recall information across the conversation')
            console.log('  • code_review  — Review code for issues, bugs, and improvements')
            console.log('  • summarize    — Summarize a file or directory')
            console.log('  • project_map  — Generate a map of the project architecture')
            console.log()
            console.log(bold(cyan('Action Tools:')))
            console.log('  • think        — Think through a problem step by step')
            console.log('  • suggest      — Suggest next steps or improvements')
            console.log('  • follow_up    — Suggest follow-up questions')
            console.log('  • plan         — Create a plan before executing')
            console.log('  • note         — Add important notes or warnings')
            console.log('  • question     — Ask a clarifying question')
          rl.prompt()
          return
        case '/stats':
          printStats(stats)
          rl.prompt()
          return
        case '/achievements':
          printAchievements(stats)
          rl.prompt()
          return
        case '/daily':
          const daily = renderDailyChallenge(stats)
          if (daily) {
            console.log(daily)
          } else {
            console.log(infoLine('No daily challenge active'))
          }
          rl.prompt()
          return
        case '/title':
          if (arg) {
            const title = TITLES.find(t => t.id === arg)
            if (title && stats.unlockedTitles.includes(arg)) {
              stats.activeTitle = arg
              saveStats(stats)
              console.log(successLine(`Title set to ${title.emoji} ${title.name}`))
            } else {
              console.log(errorLine(`Unknown or locked title: ${arg}`))
              console.log(dim('Available titles: ' + stats.unlockedTitles.map(id => {
                const t = TITLES.find(t => t.id === id)
                return t ? `${t.emoji} ${t.id}` : id
              }).join(', ')))
            }
          } else {
            console.log(infoLine('Your titles:'))
            for (const id of stats.unlockedTitles) {
              const t = TITLES.find(t => t.id === id)
              if (t) {
                const active = stats.activeTitle === id ? brightGreen(' ← active') : ''
                console.log(`  ${t.emoji} ${bold(t.id.padEnd(14))} ${t.name}${active}`)
              }
            }
          }
          rl.prompt()
          return
        case '/save':
          try {
            mkdirSync(SESSIONS_DIR, { recursive: true })
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const saveFile = join(SESSIONS_DIR, `session-${timestamp}.json`)
            const saveData = {
              savedAt: new Date().toISOString(),
              provider: currentProvider.id,
              model: currentModel,
              vibe: currentVibe.id,
              history,
              messages: history.length,
            }
            writeFileSync(saveFile, JSON.stringify(saveData, null, 2), 'utf-8')
            console.log(successLine(`Session saved to ${saveFile}`))
          } catch (err: any) {
            console.log(errorLine(`Failed to save session: ${err.message}`))
          }
          rl.prompt()
          return
        case '/load':
          try {
            if (!existsSync(SESSIONS_DIR)) {
              console.log(infoLine('No saved sessions found'))
              rl.prompt()
              return
            }
            const { readdirSync } = await import('fs')
            const files = readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json')).sort().reverse()
            if (files.length === 0) {
              console.log(infoLine('No saved sessions found'))
              rl.prompt()
              return
            }
            const loadFile = arg ? join(SESSIONS_DIR, arg) : join(SESSIONS_DIR, files[0])
            if (!existsSync(loadFile)) {
              console.log(errorLine(`Session file not found: ${loadFile}`))
              rl.prompt()
              return
            }
            const data = JSON.parse(readFileSync(loadFile, 'utf-8'))
            if (data.history) {
              history.length = 0
              history.push(...data.history)
            }
            if (data.provider) {
              const p = getProvider(data.provider)
              if (p) currentProvider = p
            }
            if (data.model) currentModel = data.model
            if (data.vibe) {
              const v = getVibe(data.vibe)
              currentVibe = v
              rl.setPrompt(`${currentVibe.colors.prompt}${currentVibe.emoji} ❯${'\x1b[0m'} `)
            }
            console.log(successLine(`Session loaded from ${loadFile} (${history.length} messages)`))
          } catch (err: any) {
            console.log(errorLine(`Failed to load session: ${err.message}`))
          }
          rl.prompt()
          return
        case '/fallback':
          const fallback = getFallbackProvider([currentProvider.id])
          if (fallback) {
            currentProvider = fallback
            currentModel = resolveModel(fallback)
            stats.providerUsage[fallback.id] = (stats.providerUsage[fallback.id] || 0) + 1
            saveStats(stats)
            console.log(successLine(`Switched to ${fallback.name} │ Model: ${brightCyan(currentModel)}`))
          } else {
            console.log(errorLine('No fallback providers available'))
          }
          rl.prompt()
          return
        case '/config':
          const config = loadConfig()
          if (arg) {
            const [key, ...valParts] = arg.split(' ')
            const val = valParts.join(' ')
            if (!val) {
              // Show specific key
              const value = (config as any)[key]
              console.log(infoLine(`${key}: ${JSON.stringify(value)}`))
            } else {
              // Set config value
              try {
                const parsed = val === 'true' ? true : val === 'false' ? false : val === 'null' ? null : isNaN(Number(val)) ? val : Number(val)
                ;(config as any)[key] = parsed
                saveConfig(config)
                console.log(successLine(`Set ${key} = ${JSON.stringify(parsed)}`))
              } catch {
                console.log(errorLine('Invalid value'))
              }
            }
          } else {
            console.log(renderConfig(config))
          }
          rl.prompt()
          return
        case '/health':
          console.log(dim('Checking provider health...'))
          checkAllNoKeyProviders(10).then(results => {
            console.log(renderHealthResults(results))
            rl.prompt()
          })
          return
        case '/powerup':
          if (arg) {
            const result = activatePowerUp(stats, arg)
            if (result.success) {
              console.log(successLine(result.message))
              saveStats(stats)
            } else {
              console.log(errorLine(result.message))
            }
          } else {
            console.log(renderPowerUps(stats))
          }
          rl.prompt()
          return
        case '/export':
          try {
            const format = arg === 'json' ? 'json' : 'markdown'
            const filePath = saveExport(history, format)
            console.log(successLine(`Conversation exported to ${filePath}`))
          } catch (err: any) {
            console.log(errorLine(`Export failed: ${err.message}`))
          }
          rl.prompt()
          return
        case '/macro':
          const aixConfig = loadConfig()
          if (!arg) {
            console.log(renderMacros(aixConfig.macros || {}))
          } else if (arg.startsWith('delete ')) {
            const name = arg.split(' ')[1]
            if (aixConfig.macros && aixConfig.macros[name]) {
              delete aixConfig.macros[name]
              saveConfig(aixConfig)
              console.log(successLine(`Macro "${name}" deleted`))
            } else {
              console.log(errorLine(`Macro "${name}" not found`))
            }
          } else if (arg.startsWith('record ')) {
            const name = arg.split(' ')[1]
            if (!lastUserMessage) {
              console.log(warningLine('Send a message first, then record it as a macro'))
            } else {
              if (!aixConfig.macros) aixConfig.macros = {}
              aixConfig.macros[name] = lastUserMessage
              saveConfig(aixConfig)
              console.log(successLine(`Macro "${name}" recorded: ${lastUserMessage.slice(0, 60)}`))
            }
          } else if (arg.includes(' ')) {
            // Run macro: /macro <name>
            const name = arg.split(' ')[0]
            if (aixConfig.macros && aixConfig.macros[name]) {
              console.log(infoLine(`Running macro "${name}"...`))
              // Simulate the user input
              lastUserMessage = aixConfig.macros[name]
              // Break out of command handling to run as a regular message
              break
            } else {
              console.log(errorLine(`Macro "${name}" not found`))
            }
          } else {
            if (aixConfig.macros && aixConfig.macros[arg]) {
              console.log(infoLine(`Macro "${arg}": ${aixConfig.macros[arg]}`))
            } else {
              console.log(renderMacros(aixConfig.macros || {}))
            }
          }
          rl.prompt()
          return
        case '/quest':
          console.log(renderQuests(stats))
          if (arg && arg.startsWith('start ')) {
            const questId = arg.split(' ')[1]
            const quest = QUESTS.find(q => q.id === questId)
            if (!quest) {
              console.log(errorLine(`Unknown quest: ${questId}`))
            } else if (stats.completedQuests.includes(questId)) {
              console.log(infoLine('Quest already completed!'))
            } else if (stats.level < quest.requiredLevel) {
              console.log(errorLine(`Requires level ${quest.requiredLevel}. You are level ${stats.level}.`))
            } else if (stats.activeQuests.includes(questId)) {
              console.log(infoLine('Quest already active!'))
            } else {
              stats.activeQuests.push(questId)
              saveStats(stats)
              console.log(successLine(`Quest "${quest.name}" started! ${quest.emoji}`))
            }
          }
          rl.prompt()
          return
        case '/weekly':
          const weeklyDisplay = renderWeeklyChallenge(stats)
          if (weeklyDisplay) {
            console.log(weeklyDisplay)
          } else {
            console.log(infoLine('No weekly challenge active'))
          }
          rl.prompt()
          return
        case '/retry':
          if (!lastUserMessage) {
            console.log(warningLine('No previous message to retry'))
            rl.prompt()
            return
          }
          if (history.length >= 2) {
            history.splice(-2)
          }
          break
        case '/compact':
          if (history.length > 4) {
            history.splice(0, history.length - 4)
            console.log(successLine(`History compacted to ${history.length} messages`))
          } else {
            console.log(infoLine('History is already compact'))
          }
          rl.prompt()
          return
        default:
          console.log(errorLine(`Unknown command: ${cmd}. Type /help for available commands.`))
          rl.prompt()
          return
      }
    } else {
      lastUserMessage = input
    }

    // Run agent
    const systemPrompt = buildSystemPrompt(cwd, currentVibe.systemPromptSuffix || undefined)
    const spinner = new Spinner()
    spinner.start('Thinking...')

    let firstChunk = true
    let textBuffer = ''
    let toolCallsThisTurn = 0
    let editsThisTurn = 0
    let bashThisTurn = 0
    const controller = new AbortController()

    const result = await runAgent({
      provider: currentProvider,
      userMessage: lastUserMessage,
      history,
      cwd,
      systemPrompt,
      noTools,
      verbose,
      onChunk: (chunk: AgentChunk) => {
        switch (chunk.type) {
          case 'text':
            if (firstChunk) {
              spinner.stop()
              firstChunk = false
            }
            process.stdout.write(chunk.text)
            textBuffer += chunk.text
            break
          case 'tool_start':
            if (firstChunk) {
              spinner.stop()
              firstChunk = false
            }
            toolCallsThisTurn++
            console.log(`\n  ${toolBadge(chunk.name)}`)
            spinner.start(`Running ${chunk.name}...`)
            break
          case 'tool_result':
            spinner.stop()
            if (chunk.isAction) {
              // Action tools: render beautifully
              try {
                const actionData = JSON.parse(chunk.output)
                console.log(renderAction(chunk.name, actionData))
              } catch {
                console.log(`  ${dim('→')} ${chunk.name}: ${chunk.output.slice(0, 200)}`)
              }
            } else {
              // Coding tools: standard rendering
              const status = chunk.success ? brightGreen('✓') : red('✗')
              if (verbose) {
                console.log(`  ${status} ${chunk.name}: ${chunk.output}`)
              } else {
                const output = chunk.output.length > 200
                  ? chunk.output.slice(0, 200) + dim('...')
                  : chunk.output
                console.log(`  ${status} ${chunk.name}: ${output}`)
              }
            }
            // Track specific tool usage
            if (chunk.name === 'edit_file' || chunk.name === 'write_file') editsThisTurn++
            if (chunk.name === 'bash') bashThisTurn++
            break
          case 'action':
            // Render action tools with beautiful formatting
            console.log(renderAction(chunk.name, chunk.data))
            break
          case 'turn_done':
            break
          case 'error':
            spinner.stop()
            console.log(`\n${errorLine(chunk.error)}`)
            break
          case 'done':
            break
        }
      },
      signal: controller.signal,
    })

    if (!firstChunk) {
      console.log()
    }
    spinner.stop()

    // Update stats
    stats.totalMessages++
    stats.messagesThisSession++
    stats.totalToolCalls += toolCallsThisTurn
    stats.toolsThisSession += toolCallsThisTurn
    stats.totalFilesEdited += editsThisTurn
    stats.editsThisSession += editsThisTurn
    stats.totalBashCommands += bashThisTurn
    stats.totalTokensIn += result.inputTokens
    stats.totalTokensOut += result.outputTokens

    // Combo system
    const { combo, comboMultiplier, isNewRecord } = updateCombo(stats)
    updateDailyChallenge(stats, 'message')
    if (toolCallsThisTurn > 0) updateDailyChallenge(stats, 'tool')
    if (editsThisTurn > 0) updateDailyChallenge(stats, 'edit')
    if (bashThisTurn > 0) updateDailyChallenge(stats, 'bash')
    if (combo >= 5) updateDailyChallenge(stats, 'combo')

    // Award XP (with combo multiplier)
    const baseXp = 5 + (toolCallsThisTurn * 3) + (editsThisTurn * 5) + (bashThisTurn * 2)
    const xpGained = Math.round(baseXp * comboMultiplier)
    const { leveledUp, newLevel, oldLevel } = addXp(stats, xpGained)

    // Check achievements
    const newAchievements = checkNewAchievements(stats)
    saveStats(stats)

    console.log()
    printTokens(result.inputTokens, result.outputTokens)

    // Show XP gain
    console.log(`  ${dim(`+${xpGained} XP`)} ${dim(`(${stats.xp} total)`)}${comboMultiplier > 1 ? ` ${dim(`×${comboMultiplier} combo`)} ` : ''}`)

    // Show combo
    const comboDisplay = renderCombo(combo, comboMultiplier)
    if (comboDisplay) console.log(`  ${comboDisplay}`)
    if (isNewRecord && combo >= 3) console.log(`  ${brightGreen('⚡ NEW COMBO RECORD!')}`)

    // Show level up
    if (leveledUp) {
      console.log(renderLevelUp(oldLevel, newLevel))
    }

    // Show achievement unlocks
    for (const achievement of newAchievements) {
      console.log(renderAchievementUnlock(achievement))
    }

    if (result.toolCallsMade > 0) {
      console.log(`  ${dim(`tools: ${result.toolCallsMade} │ turns: ${result.turns} │ ${(result.elapsed / 1000).toFixed(1)}s`)}`)
    }
    if (result.error) {
      console.log(errorLine(result.error))
    }
    console.log()

    // Update history
    history.push(...result.messages.slice(-2))
    if (history.length > 40) {
      history.splice(0, history.length - 40)
    }

    rl.prompt()
  })

  rl.on('close', () => {
    saveStats(stats)
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log(dim('\nInterrupted'))
    rl.prompt()
  })
}

async function runOneShot(provider: Provider, cwd: string, userPrompt: string, noTools: boolean, verbose: boolean, vibe: Vibe): Promise<void> {
  const model = resolveModel(provider)

  console.error(`${providerBadge(provider.name, provider.free)} │ ${dim(model)} │ ${vibe.emoji} ${vibe.name}`)

  // Track stats
  const stats = loadStats()
  updateStreak(stats)
  assignDailyChallenge(stats)
  stats.totalSessions++
  stats.totalMessages++
  stats.messagesThisSession++
  stats.providerUsage[provider.id] = (stats.providerUsage[provider.id] || 0) + 1
  stats.vibeUsage[vibe.id] = (stats.vibeUsage[vibe.id] || 0) + 1
  updateCombo(stats)
  updateDailyChallenge(stats, 'message')

  const systemPrompt = buildSystemPrompt(cwd, vibe.systemPromptSuffix || undefined)
  const spinner = new Spinner()
  spinner.start('Thinking...')

  let firstChunk = true
  let textBuffer = ''
  let toolCallsThisTurn = 0
  let editsThisTurn = 0
  let bashThisTurn = 0

  try {
    const result = await runAgent({
      provider,
      userMessage: userPrompt,
      history: [],
      cwd,
      systemPrompt,
      noTools,
      verbose,
      onChunk: (chunk: AgentChunk) => {
        switch (chunk.type) {
          case 'text':
            if (firstChunk) {
              spinner.stop()
              firstChunk = false
            }
            process.stdout.write(chunk.text)
            textBuffer += chunk.text
            break
          case 'tool_start':
            if (firstChunk) {
              spinner.stop()
              firstChunk = false
            }
            toolCallsThisTurn++
            console.log(`\n${toolBadge(chunk.name)}`)
            break
          case 'tool_result':
            if (chunk.isAction) {
              try {
                const actionData = JSON.parse(chunk.output)
                console.log(renderAction(chunk.name, actionData))
              } catch {
                console.log(`  ${dim('→')} ${chunk.name}: ${chunk.output.slice(0, 200)}`)
              }
            } else {
              const status = chunk.success ? brightGreen('✓') : red('✗')
              if (verbose) {
                console.log(`  ${status} ${chunk.name}: ${chunk.output}`)
              } else {
                const output = chunk.output.length > 200
                  ? chunk.output.slice(0, 200) + dim('...')
                  : chunk.output
                console.log(`  ${status} ${chunk.name}: ${output}`)
              }
            }
            if (chunk.name === 'edit_file' || chunk.name === 'write_file') editsThisTurn++
            if (chunk.name === 'bash') bashThisTurn++
            break
          case 'action':
            console.log(renderAction(chunk.name, chunk.data))
            break
        }
      },
    })

    if (!firstChunk) {
      console.log()
    }
    spinner.stop()

    // Update stats
    stats.totalToolCalls += toolCallsThisTurn
    stats.totalFilesEdited += editsThisTurn
    stats.totalBashCommands += bashThisTurn
    stats.totalTokensIn += result.inputTokens
    stats.totalTokensOut += result.outputTokens
    if (toolCallsThisTurn > 0) updateDailyChallenge(stats, 'tool')
    if (editsThisTurn > 0) updateDailyChallenge(stats, 'edit')
    if (bashThisTurn > 0) updateDailyChallenge(stats, 'bash')

    const xpGained = 5 + (toolCallsThisTurn * 3) + (editsThisTurn * 5) + (bashThisTurn * 2)
    const { leveledUp, newLevel, oldLevel } = addXp(stats, xpGained)
    const newAchievements = checkNewAchievements(stats)
    saveStats(stats)

    if (result.error) {
      console.error(errorLine(result.error))
      process.exit(1)
    }

    printTokens(result.inputTokens, result.outputTokens)
    console.error(`  ${dim(`+${xpGained} XP`)} ${dim(`(${stats.xp} total)`)}`)

    if (leveledUp) {
      console.error(renderLevelUp(oldLevel, newLevel))
    }
    for (const achievement of newAchievements) {
      console.error(renderAchievementUnlock(achievement))
    }
  } catch (err: any) {
    spinner.stop()
    console.error(errorLine(err.message))
    process.exit(1)
  }
}

function main(): void {
  // Check for piped input
  const hasPipedInput = !process.stdin.isTTY

  const args = process.argv.slice(2)

  let providerFlag: string | undefined
  let modelFlag: string | undefined
  let vibeFlag: string | undefined
  let noTools = false
  let verbose = false
  let quiet = false
  let oneShotPrompt: string | undefined
  let maxTurns: number | undefined
  let temperature: number | undefined
  let showStats = false
  let showLeaderboard = false
  let resetStats = false
  let useFallback = false
  let showHealth = false
  let showConfig = false
  let useBest = false
  let positional: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '-h':
      case '--help':
        printHelp()
        process.exit(0)
      case '-v':
      case '--version':
        console.log(process.env.AIX_VERSION || '1.0.0')
        process.exit(0)
      case '--providers':
        printProviders()
        process.exit(0)
      case '-p':
      case '--provider':
        providerFlag = args[++i]
        break
      case '-m':
      case '--model':
        modelFlag = args[++i]
        break
      case '--vibe':
        vibeFlag = args[++i]
        break
      case '--no-tools':
        noTools = true
        break
      case '--verbose':
        verbose = true
        break
      case '--quiet':
        quiet = true
        break
      case '-e':
      case '--exec':
        oneShotPrompt = args[++i]
        break
      case '--max-turns':
        maxTurns = parseInt(args[++i], 10)
        if (isNaN(maxTurns) || maxTurns < 1) {
          console.error(errorLine('--max-turns must be a positive number'))
          process.exit(1)
        }
        break
      case '--temperature':
        temperature = parseFloat(args[++i])
        if (isNaN(temperature) || temperature < 0 || temperature > 2) {
          console.error(errorLine('--temperature must be between 0.0 and 2.0'))
          process.exit(1)
        }
        break
      case '--stats':
        showStats = true
        break
      case '--leaderboard':
        showLeaderboard = true
        break
      case '--reset-stats':
        resetStats = true
        break
      case '--fallback':
        useFallback = true
        break
      case '--health':
        showHealth = true
        break
      case '--config':
        showConfig = true
        break
      case '--best':
        useBest = true
        break
      default:
        if (arg.startsWith('-')) {
          console.error(errorLine(`Unknown option: ${arg}`))
          console.error(`Run ${bold('aix --help')} for usage`)
          process.exit(1)
        }
        positional.push(arg)
        break
    }
  }

  // Handle stats flags
  if (showStats) {
    const stats = loadStats()
    printStats(stats)
    printAchievements(stats)
    process.exit(0)
  }

  if (resetStats) {
    const { unlinkSync } = require('fs')
    const { join } = require('path')
    const { homedir } = require('os')
    const statsFile = join(homedir(), '.aix', 'stats.json')
    try { unlinkSync(statsFile) } catch { /* ok */ }
    console.log(successLine('Stats reset! Fresh start.'))
    process.exit(0)
  }

  if (showHealth) {
    console.log(dim('Checking provider health (this may take a moment)...'))
    checkAllNoKeyProviders(15).then(results => {
      console.log(renderHealthResults(results))
      process.exit(0)
    })
    return
  }

  if (showConfig) {
    const config = loadConfig()
    console.log(renderConfig(config))
    process.exit(0)
  }

  // If no exec flag but positional args, treat as one-shot
  if (!oneShotPrompt && positional.length > 0) {
    oneShotPrompt = positional.join(' ')
  }

  // Set model env if specified
  if (modelFlag) {
    process.env.AIX_MODEL = modelFlag
  }

  // Set max turns from env
  if (maxTurns) {
    process.env.AIX_MAX_TURNS = String(maxTurns)
  }

  // Set no-tools from env
  if (process.env.AIX_NO_TOOLS === '1') {
    noTools = true
  }

  // Resolve vibe
  const vibeId = vibeFlag || process.env.AIX_VIBE || 'default'
  const vibe = getVibe(vibeId)

  // Resolve provider
  let provider: Provider
  if (providerFlag) {
    const p = getProvider(providerFlag)
    if (!p) {
      console.error(errorLine(`Unknown provider: ${providerFlag}`))
      console.error(`Run ${bold('aix --providers')} to see available providers`)
      process.exit(1)
    }
    provider = p
  } else if (useBest) {
    const best = getBestProvider()
    if (best) {
      provider = best
      console.error(dim(`⚡ Auto-selected fastest provider: ${best.name}`))
    } else {
      provider = detectProvider()
    }
  } else {
    provider = detectProvider()
  }

  // Check API key
  const apiKey = getApiKey(provider)
  if (provider.apiKeyEnv && !apiKey) {
    console.error()
    console.error(errorLine(`Missing ${provider.apiKeyEnv} environment variable`))
    console.error()
    console.error(`  Get a free API key and set it:`)
    console.error(`  ${bold(`export ${provider.apiKeyEnv}=your-key`)}`)
    console.error()
    console.error(`  Or try a completely free provider (no key needed):`)
    for (const id of FREE_NO_KEY_IDS.slice(0, 5)) {
      const p = getProvider(id)
      if (p) {
        console.error(`  ${bold(`aix -p ${id}`)}  — ${p.name}`)
      }
    }
    console.error()
    process.exit(1)
  }

  const cwd = process.cwd()

  // Handle piped input
  if (hasPipedInput && !oneShotPrompt) {
    let pipedData = ''
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk: string) => { pipedData += chunk })
    process.stdin.on('end', () => {
      const pipedPrompt = pipedData.trim()
      if (pipedPrompt) {
        oneShotPrompt = pipedPrompt
      }
      if (oneShotPrompt) {
        runOneShot(provider, cwd, oneShotPrompt, noTools, verbose, vibe)
      } else {
        process.exit(0)
      }
    })
    return
  }

  if (oneShotPrompt) {
    runOneShot(provider, cwd, oneShotPrompt, noTools, verbose, vibe)
  } else {
    runInteractive(provider, cwd, noTools, verbose, vibe)
  }
}

main()
