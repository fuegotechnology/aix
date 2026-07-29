const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
}

export function bold(s: string): string {
  return `${ANSI.bold}${s}${ANSI.reset}`
}

export function dim(s: string): string {
  return `${ANSI.dim}${s}${ANSI.reset}`
}

export function italic(s: string): string {
  return `${ANSI.italic}${s}${ANSI.reset}`
}

export function underline(s: string): string {
  return `${ANSI.underline}${s}${ANSI.reset}`
}

export function red(s: string): string {
  return `${ANSI.red}${s}${ANSI.reset}`
}

export function green(s: string): string {
  return `${ANSI.green}${s}${ANSI.reset}`
}

export function yellow(s: string): string {
  return `${ANSI.yellow}${s}${ANSI.reset}`
}

export function blue(s: string): string {
  return `${ANSI.blue}${s}${ANSI.reset}`
}

export function cyan(s: string): string {
  return `${ANSI.cyan}${s}${ANSI.reset}`
}

export function gray(s: string): string {
  return `${ANSI.gray}${s}${ANSI.reset}`
}

export function magenta(s: string): string {
  return `${ANSI.magenta}${s}${ANSI.reset}`
}

export function brightCyan(s: string): string {
  return `${ANSI.brightCyan}${s}${ANSI.reset}`
}

export function brightGreen(s: string): string {
  return `${ANSI.brightGreen}${s}${ANSI.reset}`
}

export function brightYellow(s: string): string {
  return `${ANSI.brightYellow}${s}${ANSI.reset}`
}

export function providerBadge(name: string, free: boolean): string {
  const label = `${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset}`
  const tag = free
    ? `${ANSI.green}${ANSI.bold} [free]${ANSI.reset}`
    : `${ANSI.yellow} [paid]${ANSI.reset}`
  return `${label}${tag}`
}

export function toolBadge(name: string): string {
  return `${ANSI.magenta}${ANSI.bold}⚙ ${name}${ANSI.reset}`
}

export function successLine(text: string): string {
  return `${ANSI.green}${ANSI.bold}✓${ANSI.reset} ${text}`
}

export function errorLine(text: string): string {
  return `${ANSI.red}${ANSI.bold}✗${ANSI.reset} ${text}`
}

export function infoLine(text: string): string {
  return `${ANSI.blue}ℹ${ANSI.reset} ${text}`
}

export function warningLine(text: string): string {
  return `${ANSI.yellow}⚠${ANSI.reset} ${text}`
}

export function divider(char: string = '─', width: number = 60): string {
  return `${ANSI.dim}${char.repeat(width)}${ANSI.reset}`
}

export function keyValue(key: string, value: string): string {
  return `${ANSI.gray}${key}:${ANSI.reset} ${value}`
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null
  private frameIndex = 0
  private isTTY = process.stdout.isTTY
  private text = ''

  start(text: string): void {
    if (!this.isTTY) return
    this.stop()
    this.text = text
    this.frameIndex = 0
    this.interval = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length]
      process.stdout.write(`\r${ANSI.cyan}${frame}${ANSI.reset} ${this.text}`)
      this.frameIndex++
    }, 80)
  }

  update(text: string): void {
    if (!this.isTTY || !this.interval) return
    this.text = text
  }

  stop(finalLine?: string): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.isTTY) {
      process.stdout.write('\r\x1b[K')
    }
    if (finalLine) {
      process.stdout.write(`${finalLine}\n`)
    }
  }
}

export function renderMarkdown(text: string): string {
  let result = text

  // Fenced code blocks
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const lines = code.trimEnd().split('\n')
    const header = lang ? `${ANSI.dim}── ${lang} ──${ANSI.reset}\n` : ''
    const prefixed = lines.map((l: string) => `${ANSI.gray}│${ANSI.reset} ${l}`).join('\n')
    return `${header}${prefixed}`
  })

  // Inline code
  result = result.replace(/`([^`]+)`/g, (_match, code: string) => {
    return `${ANSI.yellow}${code}${ANSI.reset}`
  })

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, (_match, text: string) => {
    return `${ANSI.bold}${text}${ANSI.reset}`
  })

  // Italic
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_match, text: string) => {
    return `${ANSI.italic}${text}${ANSI.reset}`
  })

  // Headers
  result = result.replace(/^#### (.+)$/gm, (_match, text: string) => {
    return `${ANSI.bold}${ANSI.cyan}    ${text}${ANSI.reset}`
  })
  result = result.replace(/^### (.+)$/gm, (_match, text: string) => {
    return `${ANSI.bold}${ANSI.cyan}   ${text}${ANSI.reset}`
  })
  result = result.replace(/^## (.+)$/gm, (_match, text: string) => {
    return `${ANSI.bold}${ANSI.cyan}  ${text}${ANSI.reset}`
  })
  result = result.replace(/^# (.+)$/gm, (_match, text: string) => {
    return `${ANSI.bold}${ANSI.cyan} ${text}${ANSI.reset}`
  })

  // Bullet points
  result = result.replace(/^(\s*)[-*] /gm, (_match, indent: string) => {
    return `${indent}• `
  })

  // Numbered lists
  result = result.replace(/^(\s*)(\d+)\. /gm, (_match, indent: string, num: string) => {
    return `${indent}${ANSI.dim}${num}.${ANSI.reset} `
  })

  // Horizontal rules
  result = result.replace(/^---+$/gm, () => {
    return `${ANSI.dim}${'─'.repeat(40)}${ANSI.reset}`
  })

  return result
}

export function printBanner(provider: string, model: string, cwd: string): void {
  const version = process.env.AIX_VERSION || '1.0.0'
  const cols = Math.min(process.stdout.columns || 80, 72)

  console.log()
  console.log(`  ${ANSI.bgCyan}${ANSI.bold}${ANSI.bgBlack} ◆ aix v${version} ${ANSI.reset}`)
  console.log(`  ${ANSI.dim}  AI coding assistant for your terminal${ANSI.reset}`)
  console.log()
  console.log(`  ${keyValue('Provider', `${ANSI.cyan}${provider}${ANSI.reset}`)}`)
  console.log(`  ${keyValue('Model',   `${ANSI.brightCyan}${model}${ANSI.reset}`)}`)
  console.log(`  ${keyValue('CWD',     `${ANSI.gray}${cwd}${ANSI.reset}`)}`)
  console.log()
  console.log(`  ${ANSI.dim}Type your message, or use /help for commands${ANSI.reset}`)
  console.log(`  ${ANSI.dim}Ctrl+C to interrupt • /exit to quit${ANSI.reset}`)
  console.log()
}

export function printTokens(inputTokens: number, outputTokens: number): void {
  if (inputTokens > 0 || outputTokens > 0) {
    console.log(`  ${ANSI.dim}tokens: ${ANSI.brightCyan}${inputTokens}${ANSI.reset}${ANSI.dim} in / ${ANSI.brightCyan}${outputTokens}${ANSI.reset}${ANSI.dim} out${ANSI.reset}`)
  }
}

export function printTurnInfo(turns: number, elapsed: number): void {
  console.log(`  ${ANSI.dim}turns: ${turns} • ${elapsed}ms${ANSI.reset}`)
}

export function prompt(question: string): Promise<string> {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(answer)
    })
  })
}
