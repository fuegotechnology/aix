const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

export function bold(s: string): string {
  return `${ANSI.bold}${s}${ANSI.reset}`
}

export function dim(s: string): string {
  return `${ANSI.dim}${s}${ANSI.reset}`
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

export function providerBadge(name: string, free: boolean): string {
  const label = `${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset}`
  const tag = free
    ? `${ANSI.green} [free]${ANSI.reset}`
    : `${ANSI.yellow} [paid]${ANSI.reset}`
  return `${label}${tag}`
}

export function toolBadge(name: string): string {
  return `${ANSI.magenta}⚙ ${name}${ANSI.reset}`
}

export function successLine(text: string): string {
  return `${ANSI.green}✓${ANSI.reset} ${text}`
}

export function errorLine(text: string): string {
  return `${ANSI.red}✗${ANSI.reset} ${text}`
}

export function infoLine(text: string): string {
  return `${ANSI.blue}ℹ${ANSI.reset} ${text}`
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null
  private frameIndex = 0
  private isTTY = process.stdout.isTTY

  start(text: string): void {
    if (!this.isTTY) return
    this.stop()
    this.frameIndex = 0
    this.interval = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length]
      process.stdout.write(`\r${ANSI.cyan}${frame}${ANSI.reset} ${text}`)
      this.frameIndex++
    }, 80)
  }

  update(text: string): void {
    if (!this.isTTY || !this.interval) return
    // Clear line and restart with new text
    this.stop()
    this.start(text)
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
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const lines = code.trimEnd().split('\n')
    const prefixed = lines.map((l: string) => `${ANSI.gray}│${ANSI.reset} ${l}`).join('\n')
    return prefixed
  })

  // Inline code
  result = result.replace(/`([^`]+)`/g, (_match, code) => {
    return `${ANSI.yellow}${code}${ANSI.reset}`
  })

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, (_match, text) => {
    return `${ANSI.bold}${text}${ANSI.reset}`
  })

  // Headers
  result = result.replace(/^### (.+)$/gm, (_match, text) => {
    return `${ANSI.bold}${ANSI.cyan}   ${text}${ANSI.reset}`
  })
  result = result.replace(/^## (.+)$/gm, (_match, text) => {
    return `${ANSI.bold}${ANSI.cyan}  ${text}${ANSI.reset}`
  })
  result = result.replace(/^# (.+)$/gm, (_match, text) => {
    return `${ANSI.bold}${ANSI.cyan} ${text}${ANSI.reset}`
  })

  // Bullet points
  result = result.replace(/^(\s*)[-*] /gm, (_match, indent) => {
    return `${indent}• `
  })

  return result
}

export function printBanner(provider: string, model: string, cwd: string): void {
  const version = process.env.AIX_VERSION || '1.0.0'
  console.log()
  console.log(`  ${ANSI.bold}${ANSI.cyan}◆ aix v${version}${ANSI.reset}`)
  console.log(`  ${ANSI.gray}Provider: ${provider} │ Model: ${model}${ANSI.reset}`)
  console.log(`  ${ANSI.gray}CWD: ${cwd}${ANSI.reset}`)
  console.log()
  console.log(`  ${ANSI.dim}Type your message or /help for commands${ANSI.reset}`)
  console.log()
}

export function printTokens(inputTokens: number, outputTokens: number): void {
  if (inputTokens > 0 || outputTokens > 0) {
    console.log(`  ${ANSI.gray}tokens: ${inputTokens} in / ${outputTokens} out${ANSI.reset}`)
  }
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
