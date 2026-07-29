import { resolve } from 'path'
import { providers, getProvider, detectProvider, getApiKey, resolveModel, FREE_PROVIDER_IDS } from './providers.js'
import type { Provider } from './providers.js'
import { runAgent, type AgentChunk, type Message } from './agent.js'
import { buildSystemPrompt } from './system-prompt.js'
import {
  bold, dim, red, green, yellow, cyan, gray, magenta, brightCyan, brightGreen,
  providerBadge, toolBadge, successLine, errorLine, infoLine, warningLine,
  divider, keyValue,
  Spinner, renderMarkdown, printBanner, printTokens, printTurnInfo, prompt,
} from './ui.js'

function printHelp(): void {
  const version = process.env.AIX_VERSION || '1.0.0'
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
  ${bold('--no-tools')}                   Disable tool use
  ${bold('-e, --exec <prompt>')}          One-shot mode
  ${bold('--max-turns <n>')}              Max agent turns (default: 20)
  ${bold('--temperature <n>')}            Set temperature (0.0 - 2.0)
  ${bold('--verbose')}                    Show detailed tool output
  ${bold('--quiet')}                      Minimal output (errors only)

${bold(cyan('INTERACTIVE COMMANDS'))}
  ${bold('/exit')}, ${bold('/quit')}             Exit aix
  ${bold('/clear')}                      Clear conversation history
  ${bold('/help')}                       Show help
  ${bold('/providers')}                  List providers
  ${bold('/model <name>')}               Switch model
  ${bold('/provider <id>')}              Switch provider
  ${bold('/history')}                    Show conversation history
  ${bold('/context')}                    Show project context
  ${bold('/tools')}                      List available tools
  ${bold('/retry')}                      Retry last message
  ${bold('/compact')}                    Compact conversation history

${bold(cyan('ENVIRONMENT VARIABLES'))}
  ${bold('AIX_PROVIDER')}                Provider id to use
  ${bold('AIX_MODEL')}                   Model name override
  ${bold('AIX_BASE_URL')}                Custom endpoint base URL
  ${bold('AIX_API_KEY')}                 Custom endpoint API key
  ${bold('AIX_MAX_TURNS')}               Max agent turns (default: 20)
  ${bold('AIX_SYSTEM_PROMPT')}           Custom system prompt file
  ${bold('AIX_NO_TOOLS')}                Set to "1" to disable tools
  ${bold('AIX_USE_<PROVIDER>')}          Quick-select provider (e.g. AIX_USE_GEMINI=1)

${bold(cyan('FREE PROVIDERS (no credit card)'))}
  ${brightGreen('pollinations')}       No key needed — just works
  ${brightGreen('llm7')}               No key needed — just works
  ${brightGreen('gemini')}             Free API key from Google AI Studio
  ${brightGreen('groq')}               Free API key from groq.com
  ${brightGreen('cerebras')}           Free API key from cloud.cerebras.ai
  ${brightGreen('deepseek')}           Free API key from platform.deepseek.com
  ${brightGreen('mistral')}            Free API key from console.mistral.ai
  ${brightGreen('cohere')}             Free API key from dashboard.cohere.com
  ${brightGreen('nvidia')}             Free API key from build.nvidia.com
  ${brightGreen('githubmodels')}       Use your GitHub token
  ${brightGreen('huggingface')}        Free API key from huggingface.co
  ${brightGreen('siliconflow')}        Free API key from siliconflow.cn
  ${brightGreen('chutes')}             Free API key from chutes.ai
  ${brightGreen('glhf')}               Free API key from glhf.chat

${bold(cyan('EXAMPLES'))}
  ${dim('# Start interactive (auto-detects provider)')}
  aix

  ${dim('# One-shot question')}
  aix "explain this codebase"

  ${dim('# Completely free, no setup')}
  aix -p pollinations "hello"
  aix -p llm7 "write a hello world in rust"

  ${dim('# Use a specific provider and model')}
  aix -p groq -m llama-3.3-70b-versatile "fix the bug"
  aix -p gemini -m gemini-2.5-pro "optimize this function"

  ${dim('# Use environment variables')}
  AIX_USE_GEMINI=1 aix "explain this code"
  AIX_PROVIDER=groq AIX_MODEL=mixtral-8x7b-32768 aix

  ${dim('# Local models')}
  aix -p ollama "what is this project?"
  aix -p lmstudio "refactor this code"
  aix -p vllm "write tests"

  ${dim('# Advanced options')}
  aix --max-turns 5 --temperature 0.2 "be precise"
  aix --no-tools "just chat with me"
  aix --verbose "fix all the bugs"
`)
}

function printProviders(): void {
  const freeNoKey = providers.filter(p => p.free && !p.local && !p.apiKeyEnv)
  const freeTier = providers.filter(p => p.free && !p.local && p.apiKeyEnv)
  const paid = providers.filter(p => !p.free && !p.local)
  const local = providers.filter(p => p.local)

  const printGroup = (title: string, list: Provider[]) => {
    console.log(`\n${bold(cyan(title))}`)
    console.log(divider('─', 70))
    for (const p of list) {
      const key = p.apiKeyEnv ? gray(`(${p.apiKeyEnv})`) : gray('(no key needed)')
      const model = dim(p.defaultModel)
      const desc = p.description ? dim(`  ${p.description.slice(0, 50)}`) : ''
      console.log(`  ${bold(p.id.padEnd(16))} ${p.name.padEnd(22)} ${key}`)
      if (p.description) {
        console.log(`  ${''.padEnd(16)} ${dim(p.description.slice(0, 60))}`)
      }
      if (p.models.length > 0 && p.models.length <= 8) {
        const modelList = p.models.map(m => {
          const freeTag = m.free ? brightGreen('✓') : ' '
          const toolsTag = m.supportsTools ? '🔧' : '  '
          return `${freeTag} ${toolsTag} ${m.id}`
        }).join(dim(' │ '))
        console.log(`  ${''.padEnd(16)} ${dim('models:')} ${modelList}`)
      }
    }
  }

  console.log()
  console.log(`  ${bold('◆ aix — Supported Providers')} ${dim(`(${providers.length} providers)`)}`)
  console.log()
  printGroup('🆓 FREE — No API Key Needed', freeNoKey)
  printGroup('🆓 FREE — Free API Key (no credit card)', freeTier)
  printGroup('💳 PAID — Requires Payment', paid)
  printGroup('🏠 LOCAL — Self-Hosted (always free)', local)

  console.log()
  console.log(`  ${bold('Quick Start')}`)
  console.log()
  console.log(`  ${brightGreen('No setup:')}   aix -p pollinations "hello"`)
  console.log(`  ${brightGreen('Free key:')}    AIX_USE_GEMINI=1 aix "explain this code"`)
  console.log(`  ${brightGreen('Local:')}      aix -p ollama "what is this project?"`)
  console.log(`  ${brightGreen('Speed:')}      aix -p groq "fix the bug in main.ts"`)
  console.log()
  console.log(`  ${dim('Legend:')} ${brightGreen('✓')} = free model  🔧 = supports tools`)
  console.log()
}

async function runInteractive(provider: Provider, cwd: string, noTools: boolean, verbose: boolean): Promise<void> {
  const model = resolveModel(provider)
  const apiKey = getApiKey(provider)
  printBanner(provider.name, model, cwd)

  const history: Message[] = []
  let currentProvider = provider
  let currentModel = model
  let lastUserMessage = ''
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${bold(cyan('❯'))} `,
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
          console.log(dim('Goodbye! 👋'))
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
              console.log(successLine(`Provider: ${p.name} │ Model: ${brightCyan(currentModel)}`))
            } else {
              console.log(errorLine(`Unknown provider: ${arg}. Run /providers to see available options.`))
            }
          } else {
            console.log(infoLine(`Current provider: ${currentProvider.name} │ Model: ${brightCyan(currentModel)}`))
          }
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
          console.log(bold(cyan('Available tools:')))
          console.log('  • read_file    — Read file contents with line numbers')
          console.log('  • write_file   — Create or overwrite files')
          console.log('  • edit_file    — Find and replace text in files')
          console.log('  • bash         — Run shell commands')
          console.log('  • list_files   — List files and directories')
          console.log('  • search_files — Search across files with regex')
          console.log('  • glob_find    — Find files matching a pattern')
          console.log('  • tree         — Display directory tree')
          console.log('  • diagnose     — Run project diagnostics')
          rl.prompt()
          return
        case '/retry':
          if (!lastUserMessage) {
            console.log(warningLine('No previous message to retry'))
            rl.prompt()
            return
          }
          // Remove last exchange from history
          if (history.length >= 2) {
            history.splice(-2)
          }
          // Fall through to process lastUserMessage
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
    const systemPrompt = buildSystemPrompt(cwd)
    const spinner = new Spinner()
    spinner.start('Thinking...')

    let firstChunk = true
    let textBuffer = ''
    let toolCalls = 0
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
            toolCalls++
            console.log(`\n  ${toolBadge(chunk.name)}`)
            spinner.start(`Running ${chunk.name}...`)
            break
          case 'tool_result':
            spinner.stop()
            const status = chunk.success ? brightGreen('✓') : red('✗')
            if (verbose) {
              console.log(`  ${status} ${chunk.name}: ${chunk.output}`)
            } else {
              const output = chunk.output.length > 200
                ? chunk.output.slice(0, 200) + dim('...')
                : chunk.output
              console.log(`  ${status} ${chunk.name}: ${output}`)
            }
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

    console.log()
    printTokens(result.inputTokens, result.outputTokens)
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
    process.exit(0)
  })

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(dim('\nInterrupted'))
    rl.prompt()
  })
}

async function runOneShot(provider: Provider, cwd: string, userPrompt: string, noTools: boolean, verbose: boolean): Promise<void> {
  const model = resolveModel(provider)
  const apiKey = getApiKey(provider)

  console.error(`${providerBadge(provider.name, provider.free)} │ ${dim(model)}`)

  const systemPrompt = buildSystemPrompt(cwd)
  const spinner = new Spinner()
  spinner.start('Thinking...')

  let firstChunk = true
  let textBuffer = ''

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
            console.log(`\n${toolBadge(chunk.name)}`)
            break
          case 'tool_result':
            const status = chunk.success ? brightGreen('✓') : red('✗')
            if (verbose) {
              console.log(`  ${status} ${chunk.name}: ${chunk.output}`)
            } else {
              const output = chunk.output.length > 200
                ? chunk.output.slice(0, 200) + dim('...')
                : chunk.output
              console.log(`  ${status} ${chunk.name}: ${output}`)
            }
            break
        }
      },
    })

    if (!firstChunk) {
      console.log()
    }
    spinner.stop()

    if (result.error) {
      console.error(errorLine(result.error))
      process.exit(1)
    }

    printTokens(result.inputTokens, result.outputTokens)
    if (result.toolCallsMade > 0) {
      console.error(`  ${dim(`tools: ${result.toolCallsMade} │ turns: ${result.turns} │ ${(result.elapsed / 1000).toFixed(1)}s`)}`)
    }
  } catch (err: any) {
    spinner.stop()
    console.error(errorLine(err.message))
    process.exit(1)
  }
}

function main(): void {
  const args = process.argv.slice(2)

  let providerFlag: string | undefined
  let modelFlag: string | undefined
  let noTools = false
  let verbose = false
  let quiet = false
  let oneShotPrompt: string | undefined
  let maxTurns: number | undefined
  let temperature: number | undefined
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
    for (const id of FREE_PROVIDER_IDS.slice(0, 5)) {
      const p = getProvider(id)
      if (p && !p.apiKeyEnv) {
        console.error(`  ${bold(`aix -p ${id}`)}  — ${p.name}`)
      }
    }
    console.error()
    process.exit(1)
  }

  const cwd = process.cwd()

  if (oneShotPrompt) {
    runOneShot(provider, cwd, oneShotPrompt, noTools, verbose)
  } else {
    runInteractive(provider, cwd, noTools, verbose)
  }
}

main()
