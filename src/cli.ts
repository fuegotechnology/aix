import { resolve } from 'path'
import { providers, getProvider, detectProvider, getApiKey, resolveModel, FREE_PROVIDER_IDS } from './providers.js'
import type { Provider } from './providers.js'
import { runAgent, type AgentChunk, type Message } from './agent.js'
import { buildSystemPrompt } from './system-prompt.js'
import {
  bold, dim, red, green, yellow, cyan, gray, magenta,
  providerBadge, toolBadge, successLine, errorLine, infoLine,
  Spinner, renderMarkdown, printBanner, printTokens, prompt,
} from './ui.js'

function printHelp(): void {
  const version = process.env.AIX_VERSION || '1.0.0'
  console.log(`
${bold(`aix v${version}`)} — AI coding assistant for your terminal

${cyan('USAGE')}
  aix [options] [prompt]       Interactive mode (default)
  aix -e "prompt"              One-shot mode
  aix "prompt"                 One-shot mode (positional)

${cyan('OPTIONS')}
  -h, --help                   Show this help
  -v, --version                Show version
  --providers                  List all providers
  -p, --provider <id>          Use a specific provider
  -m, --model <name>           Set model (also via AIX_MODEL env)
  --no-tools                   Disable tool use
  -e, --exec <prompt>          One-shot mode

${cyan('INTERACTIVE COMMANDS')}
  /exit, /quit                 Exit aix
  /clear                       Clear conversation history
  /help                        Show help
  /providers                   List providers
  /model <name>                Switch model
  /provider <id>               Switch provider
  /history                     Show conversation history

${cyan('ENVIRONMENT VARIABLES')}
  AIX_PROVIDER                 Provider id to use
  AIX_MODEL                    Model name override
  AIX_BASE_URL                 Custom endpoint base URL
  AIX_API_KEY                  Custom endpoint API key
  AIX_USE_<PROVIDER>           Quick-select provider (e.g. AIX_USE_GEMINI=1)

${cyan('FREE PROVIDERS (no credit card)')}
  pollinations                 No key needed — just works
  llm7                         No key needed — just works
  gemini                       Free API key from Google AI Studio
  groq                         Free API key from groq.com
  cerebras                     Free API key from cloud.cerebras.ai
  deepseek                     Free API key from platform.deepseek.com
  mistral                      Free API key from console.mistral.ai
  cohere                       Free API key from dashboard.cohere.com
  nvidia                       Free API key from build.nvidia.com
  githubmodels                 Use your GitHub token
  huggingface                  Free API key from huggingface.co
  siliconflow                  Free API key from siliconflow.cn

${cyan('EXAMPLES')}
  aix                          Start interactive (auto-detects provider)
  aix "explain this codebase"  One-shot question
  AIX_USE_GEMINI=1 aix        Use Google Gemini
  aix -p groq -m llama-3.3-70b-versatile "fix the bug"
  aix -p pollinations "hello"  Completely free, no setup
`)
}

function printProviders(): void {
  const freeNoKey = providers.filter(p => p.free && !p.local && !p.apiKeyEnv)
  const freeTier = providers.filter(p => p.free && !p.local && p.apiKeyEnv)
  const paid = providers.filter(p => !p.free && !p.local)
  const local = providers.filter(p => p.local)

  const printGroup = (title: string, list: Provider[]) => {
    console.log(`\n${bold(cyan(title))}`)
    console.log(dim('─'.repeat(60)))
    for (const p of list) {
      const key = p.apiKeyEnv ? gray(`(${p.apiKeyEnv})`) : gray('(no key needed)')
      const model = dim(p.defaultModel)
      console.log(`  ${bold(p.id.padEnd(16))} ${p.name.padEnd(22)} ${key} ${model}`)
    }
  }

  console.log(`\n${bold('◆ aix — Supported Providers')}\n`)
  printGroup('FREE — No API Key Needed', freeNoKey)
  printGroup('FREE — Free API Key (no credit card)', freeTier)
  printGroup('PAID — Requires Payment', paid)
  printGroup('LOCAL — Self-Hosted', local)

  console.log(`\n${bold('Quick Start')}`)
  console.log(`  ${green('No setup:')}   aix -p pollinations "hello"`)
  console.log(`  ${green('Free key:')}    AIX_USE_GEMINI=1 aix "explain this code"`)
  console.log(`  ${green('Local:')}      aix -p ollama "what is this project?"`)
  console.log()
}

async function runInteractive(provider: Provider, cwd: string, noTools: boolean): Promise<void> {
  const model = resolveModel(provider)
  const apiKey = getApiKey(provider)
  printBanner(provider.name, model, cwd)

  const history: Message[] = []
  let currentProvider = provider
  let currentModel = model
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${cyan('❯')} `,
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
          console.log(dim('Goodbye!'))
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
            console.log(successLine(`Model set to ${arg}`))
          } else {
            console.log(infoLine(`Current model: ${currentModel}`))
          }
          rl.prompt()
          return
        case '/provider':
          if (arg) {
            const p = getProvider(arg)
            if (p) {
              currentProvider = p
              currentModel = resolveModel(p)
              console.log(successLine(`Provider: ${p.name} │ Model: ${currentModel}`))
            } else {
              console.log(errorLine(`Unknown provider: ${arg}`))
            }
          } else {
            console.log(infoLine(`Current provider: ${currentProvider.name}`))
          }
          rl.prompt()
          return
        case '/history':
          console.log(infoLine(`${history.length} messages in history`))
          rl.prompt()
          return
        default:
          console.log(errorLine(`Unknown command: ${cmd}`))
          rl.prompt()
          return
      }
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
      userMessage: input,
      history,
      cwd,
      systemPrompt,
      noTools,
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
            break
          case 'tool_result':
            const status = chunk.success ? green('✓') : red('✗')
            const output = chunk.output.length > 200
              ? chunk.output.slice(0, 200) + dim('...')
              : chunk.output
            console.log(`  ${status} ${chunk.name}: ${output}`)
            break
          case 'turn_done':
            break
          case 'error':
            spinner.stop()
            console.log(`\n${errorLine(chunk.error)}`)
            break
        }
      },
      signal: controller.signal,
    })

    if (!firstChunk) {
      console.log()
    }
    spinner.stop()

    if (result.text) {
      console.log()
    }

    printTokens(result.inputTokens, result.outputTokens)
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

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log(dim('\nInterrupted'))
    rl.prompt()
  })
}

async function runOneShot(provider: Provider, cwd: string, userPrompt: string, noTools: boolean): Promise<void> {
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
            const status = chunk.success ? green('✓') : red('✗')
            const output = chunk.output.length > 200
              ? chunk.output.slice(0, 200) + dim('...')
              : chunk.output
            console.log(`  ${status} ${chunk.name}: ${output}`)
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
  let oneShotPrompt: string | undefined
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
      case '-e':
      case '--exec':
        oneShotPrompt = args[++i]
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
    console.error(errorLine(`Missing ${provider.apiKeyEnv} environment variable`))
    console.error()
    console.error(`  Get a free API key and set it:`)
    console.error(`  ${bold(`export ${provider.apiKeyEnv}=your-key`)}`)
    console.error()
    console.error(`  Or try a completely free provider (no key needed):`)
    for (const id of FREE_PROVIDER_IDS.slice(0, 4)) {
      const p = getProvider(id)
      if (p && !p.apiKeyEnv) {
        console.error(`  ${bold(`aix -p ${id}`)}  — ${p.name}`)
      }
    }
    process.exit(1)
  }

  const cwd = process.cwd()
  const userPrompt = oneShotPrompt

  if (userPrompt) {
    runOneShot(provider, cwd, userPrompt, noTools)
  } else {
    runInteractive(provider, cwd, noTools)
  }
}

main()
