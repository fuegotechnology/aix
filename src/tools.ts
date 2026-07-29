import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import { resolve, dirname, basename, relative, join, extname } from 'path'
import { glob } from 'glob'
import type { Tool } from './llm.js'

// ── Coding tools (file/bash operations) ──

export const CODING_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file with line numbers. Supports reading specific line ranges.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          start_line: { type: 'number', description: 'Starting line number (1-based)' },
          end_line: { type: 'number', description: 'Ending line number (1-based)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file with the given content. Creates parent directories automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          content: { type: 'string', description: 'Full content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Find and replace exact text in a file. Returns error if old_text not found or matches multiple times.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          old_text: { type: 'string', description: 'Exact text to find' },
          new_text: { type: 'string', description: 'Replacement text' },
        },
        required: ['path', 'old_text', 'new_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Run a bash command in the project directory. Returns stdout, or combined stdout+stderr on error.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Bash command to run' },
          timeout: { type: 'number', description: 'Timeout in seconds (max 120, default 30)' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories. Supports glob patterns, recursion, and file size display.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: .)' },
          recursive: { type: 'boolean', description: 'List recursively' },
          pattern: { type: 'string', description: 'Glob pattern to filter files' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search across files for a regex pattern. Returns up to 50 matches.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          path: { type: 'string', description: 'Directory to search in' },
          file_pattern: { type: 'string', description: 'Glob pattern for files to search' },
          case_sensitive: { type: 'boolean', description: 'Case sensitive search (default: false)' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'glob_find',
      description: 'Find files matching a glob pattern.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g. "**/*.test.ts")' },
          path: { type: 'string', description: 'Directory to search in (default: .)' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tree',
      description: 'Display a directory tree structure.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: .)' },
          max_depth: { type: 'number', description: 'Maximum depth (default: 3)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'diagnose',
      description: 'Run diagnostic checks on the project. Checks for common issues.',
      parameters: {
        type: 'object',
        properties: {
          checks: { type: 'string', description: 'Which checks: "all", "deps", "types", "lint", "tests" (default: "all")' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Fetch the content of a URL. Returns the text content of the page. Useful for reading documentation, APIs, or web pages.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
          method: { type: 'string', description: 'HTTP method (default: GET)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_status',
      description: 'Show the git status of the project, including current branch, staged/unstaged changes, and recent commits.',
      parameters: {
        type: 'object',
        properties: {
          detailed: { type: 'boolean', description: 'Show detailed diff stats (default: false)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'env_info',
      description: 'Show environment information: Node.js version, npm version, OS, shell, and available tools.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'todo',
      description: 'Manage a todo list for the current session. Add, list, complete, or remove tasks.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'What to do: "add", "list", "complete", "remove"', enum: ['add', 'list', 'complete', 'remove'] },
          task: { type: 'string', description: 'The task description (for add) or task ID (for complete/remove)' },
          priority: { type: 'string', description: 'Priority: "high", "medium", "low" (default: "medium")', enum: ['high', 'medium', 'low'] },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'diff_view',
      description: 'Show a diff of uncommitted changes in the git repository. Shows what has been modified but not yet committed.',
      parameters: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Specific file to diff (default: all files)' },
          staged: { type: 'boolean', description: 'Show staged changes instead of unstaged (default: false)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'memory',
      description: 'Save or recall important information across the conversation. Use to remember key decisions, architecture notes, or user preferences.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'What to do: "save", "recall", "list", "clear"', enum: ['save', 'recall', 'list', 'clear'] },
          key: { type: 'string', description: 'The memory key (for save/recall)' },
          value: { type: 'string', description: 'The value to save' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'code_review',
      description: 'Review code for potential issues, bugs, style violations, and improvements. Reads a file and provides structured feedback.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file to review' },
          focus: { type: 'string', description: 'Focus area: "bugs", "security", "performance", "style", "all" (default: "all")' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarize',
      description: 'Summarize the contents of a file or directory. Provides a concise overview of the code structure, purpose, and key functions.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file or directory to summarize' },
          depth: { type: 'number', description: 'Summary depth: 1 (brief), 2 (moderate), 3 (detailed) (default: 2)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'project_map',
      description: 'Generate a map of the project showing the architecture, dependencies, and key modules. Useful for understanding a new codebase.',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', description: 'Output format: "text", "mermaid" (default: "text")' },
        },
      },
    },
  },
]

// ── Action tools (structured thinking & suggestions) ──

export const ACTION_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'think',
      description: 'Think through a problem step by step. Use this to reason about complex problems, plan your approach, or work through a bug before acting. Your thinking is shown to the user as a thought bubble.',
      parameters: {
        type: 'object',
        properties: {
          thoughts: { type: 'string', description: 'Your step-by-step reasoning and analysis' },
          confidence: { type: 'string', description: 'How confident you are: high, medium, low', enum: ['high', 'medium', 'low'] },
        },
        required: ['thoughts'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest',
      description: 'Suggest next steps or improvements to the user. Use after completing a task or when you see opportunities for improvement.',
      parameters: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            description: 'List of suggestions with titles and descriptions',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Short title for the suggestion' },
                description: { type: 'string', description: 'What this suggestion involves' },
                priority: { type: 'string', description: 'Priority level', enum: ['high', 'medium', 'low'] },
              },
              required: ['title', 'description'],
            },
          },
        },
        required: ['suggestions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'follow_up',
      description: 'Suggest follow-up questions or actions the user might want to take. Use at the end of a response to keep the conversation going.',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            description: 'Follow-up questions or prompts the user can try',
            items: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'The suggested prompt the user can send' },
                reason: { type: 'string', description: 'Why this follow-up would be useful' },
              },
              required: ['prompt', 'reason'],
            },
          },
        },
        required: ['questions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'plan',
      description: 'Create a plan before executing a complex task. Shows the user your intended approach step by step.',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'What you are trying to accomplish' },
          steps: {
            type: 'array',
            description: 'Ordered list of steps to take',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string', description: 'What you will do in this step' },
                tool: { type: 'string', description: 'Which tool you will use (if any)' },
                reason: { type: 'string', description: 'Why this step is needed' },
              },
              required: ['action', 'reason'],
            },
          },
        },
        required: ['goal', 'steps'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'note',
      description: 'Add an important note or warning for the user. Use to highlight potential issues, gotchas, or important context.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The note or warning message' },
          level: { type: 'string', description: 'Severity level', enum: ['info', 'warning', 'danger'] },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'question',
      description: 'Ask the user a clarifying question before proceeding. Use when you are unsure about something and need the user\'s input.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to ask the user' },
          options: {
            type: 'array',
            description: 'Suggested options the user can choose from',
            items: { type: 'string' },
          },
          reason: { type: 'string', description: 'Why you need this clarification' },
        },
        required: ['question'],
      },
    },
  },
]

export const TOOLS: Tool[] = [...CODING_TOOLS, ...ACTION_TOOLS]

// ── Tool type classification ──

export const ACTION_TOOL_NAMES = new Set(ACTION_TOOLS.map(t => t.function.name))
export const CODING_TOOL_NAMES = new Set(CODING_TOOLS.map(t => t.function.name))

export function isActionTool(name: string): boolean {
  return ACTION_TOOL_NAMES.has(name)
}

export function isCodingTool(name: string): boolean {
  return CODING_TOOL_NAMES.has(name)
}

// ── Tool implementations ──

function readFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) return `Error: file not found: ${filePath}`
  const stat = statSync(filePath)
  if (stat.isDirectory()) return `Error: ${filePath} is a directory, not a file. Use list_files or tree instead.`
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const start = args.start_line ? Math.max(1, args.start_line) : 1
  const end = args.end_line ? Math.min(lines.length, args.end_line) : lines.length
  const selected = lines.slice(start - 1, end)
  const numbered = selected.map((line, i) => `${String(start + i).padStart(4)} │ ${line}`).join('\n')
  const sizeKB = (stat.size / 1024).toFixed(1)
  return `${filePath} (${lines.length} lines, ${sizeKB}KB, showing ${start}-${end})\n${numbered}`
}

function writeFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  const existed = existsSync(filePath)
  const dir = dirname(filePath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, args.content, 'utf-8')
  const lineCount = args.content.split('\n').length
  const sizeKB = Buffer.byteLength(args.content, 'utf-8') / 1024
  const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB.toFixed(1)}KB`
  return existed ? `Updated ${filePath} (${lineCount} lines, ${sizeStr})` : `Created ${filePath} (${lineCount} lines, ${sizeStr})`
}

function editFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) return `Error: file not found: ${filePath}`
  const content = readFileSync(filePath, 'utf-8')
  const oldLines = content.split('\n').length
  const index = content.indexOf(args.old_text)
  if (index === -1) {
    const lines = content.split('\n')
    const preview = lines.slice(0, 5).map((l, i) => `${i + 1}: ${l}`).join('\n')
    return `Error: old_text not found in ${filePath}\n\nFile starts with:\n${preview}\n\nMake sure old_text matches exactly.`
  }
  const secondIndex = content.indexOf(args.old_text, index + 1)
  if (secondIndex !== -1) return `Error: old_text found multiple times in ${filePath}. Please include more surrounding context to make the match unique.`
  const newContent = content.replace(args.old_text, args.new_text)
  writeFileSync(filePath, newContent, 'utf-8')
  const newLines = newContent.split('\n').length
  const diff = newLines - oldLines
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`
  return `Edited ${filePath} (${diffStr} lines, ${oldLines} → ${newLines})`
}

function bashCommand(args: Record<string, any>, cwd: string): string {
  const command = args.command
  const dangerous = /rm\s+-rf\s+\/\s*$|^sudo\s+rm\s|>\s*\/dev\/(sda|hda|nvme|disk)|mkfs\.|dd\s+if=|:\(\)\{.*;\};\s*:\s*|chmod\s+-R\s+777\s+\//
  if (dangerous.test(command)) return `Error: command blocked for safety: ${command}\nIf this is a mistake, please run the command manually.`
  const timeoutSec = Math.min(args.timeout || 30, 120)
  const timeoutMs = timeoutSec * 1000
  try {
    const result = execSync(command, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' })
    return result || '(no output)'
  } catch (err: any) {
    const output = (err.stdout || '') + (err.stderr || '')
    if (err.killed) return `Error: command timed out after ${timeoutSec}s\n${output}`
    return output || `Error: ${err.message}`
  }
}

async function listFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  if (!existsSync(dir)) return `Error: directory not found: ${dir}`
  const pattern = args.pattern || (args.recursive ? '**/*' : '*')
  const files = await glob(pattern, { cwd: dir, nodir: true, ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**', '.next/**', '.nuxt/**', 'build/**', 'coverage/**', '.cache/**'] })
  if (files.length === 0) return `No files found in ${dir} matching "${pattern}"`
  const lines = files.slice(0, 200).map(f => {
    try {
      const stat = statSync(resolve(dir, f))
      const size = stat.size < 1024 ? `${stat.size}B` : stat.size < 1048576 ? `${(stat.size / 1024).toFixed(1)}KB` : `${(stat.size / 1048576).toFixed(1)}MB`
      return `${f}  ${size}`
    } catch { return f }
  })
  const suffix = files.length > 200 ? `\n... and ${files.length - 200} more files` : ''
  return `${dir} (${files.length} files)\n${lines.join('\n')}${suffix}`
}

async function searchFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const filePattern = args.file_pattern || '**/*.{ts,js,tsx,jsx,py,md,txt,json,yaml,yml,toml,rs,go,java,c,cpp,h,hpp,rb,php,sh,sql,html,css,scss,vue,svelte,astro,swift,kt,scala,dart,zig}'
  const caseSensitive = args.case_sensitive || false
  const flags = caseSensitive ? 'g' : 'gi'
  let regex: RegExp
  try { regex = new RegExp(args.pattern, flags) } catch { return `Error: invalid regex pattern: ${args.pattern}` }
  const files = await glob(filePattern, { cwd: dir, nodir: true, ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'] })
  const matches: string[] = []
  for (const file of files) {
    if (matches.length >= 50) break
    const fullPath = resolve(dir, file)
    try {
      const content = readFileSync(fullPath, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (matches.length >= 50) break
        if (regex.test(lines[i])) {
          const trimmed = lines[i].trim()
          matches.push(`${file}:${i + 1}: ${trimmed.slice(0, 200)}`)
        }
        regex.lastIndex = 0
      }
    } catch { /* skip */ }
  }
  if (matches.length === 0) return `No matches found for "${args.pattern}" in ${dir}`
  return `Found ${matches.length} matches for "${args.pattern}" in ${dir}\n${matches.join('\n')}`
}

async function globFind(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const files = await glob(args.pattern, { cwd: dir, nodir: true, ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**'] })
  if (files.length === 0) return `No files matching "${args.pattern}" in ${dir}`
  return files.slice(0, 100).join('\n')
}

function tree(args: Record<string, any>, cwd: string): string {
  const dir = resolve(cwd, args.path || '.')
  const maxDepth = args.max_depth || 3
  if (!existsSync(dir)) return `Error: directory not found: ${dir}`
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', '__pycache__', '.venv', '.next', '.nuxt', 'build', 'coverage', '.cache', '.turbo', '.parcel-cache', 'target', 'out', '.output'])
  function buildTree(currentPath: string, prefix: string, depth: number): string {
    if (depth > maxDepth) return ''
    let result = ''
    try {
      const entries = readdirSync(currentPath, { withFileTypes: true }).filter(e => !ignoreDirs.has(e.name) && !e.name.startsWith('.')).sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })
      const maxEntries = 30
      const shown = entries.slice(0, maxEntries)
      const hidden = entries.length - maxEntries
      for (let i = 0; i < shown.length; i++) {
        const entry = shown[i]
        const isLast = i === shown.length - 1 && hidden <= 0
        const connector = isLast ? '└── ' : '├── '
        const name = entry.isDirectory() ? `${entry.name}/` : entry.name
        result += `${prefix}${connector}${name}\n`
        if (entry.isDirectory()) {
          result += buildTree(join(currentPath, entry.name), prefix + (isLast ? '    ' : '│   '), depth + 1)
        }
      }
      if (hidden > 0) result += `${prefix}└── ... (${hidden} more)\n`
    } catch { /* skip */ }
    return result
  }
  return `${basename(dir) || dir}/\n${buildTree(dir, '', 1)}`
}

function diagnose(args: Record<string, any>, cwd: string): string {
  const results: string[] = []
  const pkgPath = resolve(cwd, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      results.push(`✓ package.json: ${pkg.name}@${pkg.version}`)
    } catch { results.push('✗ package.json could not be parsed') }
    results.push(existsSync(resolve(cwd, 'node_modules')) ? '✓ node_modules exists' : '✗ node_modules missing — run npm install')
  }
  if (existsSync(resolve(cwd, 'tsconfig.json'))) {
    results.push('✓ tsconfig.json found')
    try {
      const output = execSync('npx tsc --noEmit 2>&1', { cwd, timeout: 30000, encoding: 'utf-8' })
      results.push('✓ TypeScript: no errors')
    } catch (err: any) {
      const errorCount = ((err.stdout || '').match(/error TS/g) || []).length
      results.push(`✗ TypeScript: ${errorCount} error(s)`)
    }
  }
  const gitDir = existsSync(resolve(cwd, '.git'))
  results.push(gitDir ? '✓ Git repository found' : 'ℹ Not a git repository')
  return results.join('\n')
}

function webFetch(args: Record<string, any>, cwd: string): string {
  const url = args.url
  try {
    const result = execSync(`curl -sL -w "\\n%{http_code}" --max-time 15 "${url}"`, { cwd, timeout: 20000, encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 })
    const lines = result.split('\n')
    const statusCode = parseInt(lines.pop() || '0', 10)
    const body = lines.join('\n')
    if (statusCode >= 400) return `Error: HTTP ${statusCode} fetching ${url}`
    // Truncate very large responses
    if (body.length > 50000) return `${url} (HTTP ${statusCode}, ${body.length} bytes, truncated)\n${body.slice(0, 50000)}\n... (truncated)`
    return `${url} (HTTP ${statusCode}, ${body.length} bytes)\n${body}`
  } catch (err: any) {
    return `Error fetching ${url}: ${err.message}`
  }
}

function gitStatus(args: Record<string, any>, cwd: string): string {
  if (!existsSync(resolve(cwd, '.git'))) return 'Not a git repository'
  const results: string[] = []
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim()
    results.push(`Branch: ${branch}`)
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim()
    if (!status) {
      results.push('Working tree clean')
    } else {
      const lines = status.split('\n')
      const staged = lines.filter(l => l[0] !== ' ' && l[0] !== '?').length
      const modified = lines.filter(l => l[0] === ' ' || l[1] === 'M').length
      const untracked = lines.filter(l => l[0] === '?').length
      results.push(`${staged} staged, ${modified} modified, ${untracked} untracked`)
      if (args.detailed) {
        results.push('')
        for (const line of lines.slice(0, 30)) {
          results.push(`  ${line}`)
        }
        if (lines.length > 30) results.push(`  ... and ${lines.length - 30} more`)
      }
    }
    const log = execSync('git log --oneline -5', { cwd, encoding: 'utf-8' }).trim()
    results.push('')
    results.push('Recent commits:')
    for (const line of log.split('\n')) {
      results.push(`  ${line}`)
    }
  } catch (err: any) {
    results.push(`Error: ${err.message}`)
  }
  return results.join('\n')
}

function envInfo(args: Record<string, any>, cwd: string): string {
  const results: string[] = []
  try { results.push(`Node.js: ${process.version}`) } catch { /* skip */ }
  try {
    const npmVer = execSync('npm --version', { cwd, encoding: 'utf-8', timeout: 5000 }).trim()
    results.push(`npm: ${npmVer}`)
  } catch { /* skip */ }
  try {
    const pnpmVer = execSync('pnpm --version', { cwd, encoding: 'utf-8', timeout: 5000 }).trim()
    results.push(`pnpm: ${pnpmVer}`)
  } catch { /* skip */ }
  try {
    const yarnVer = execSync('yarn --version', { cwd, encoding: 'utf-8', timeout: 5000 }).trim()
    results.push(`yarn: ${yarnVer}`)
  } catch { /* skip */ }
  try {
    const gitVer = execSync('git --version', { cwd, encoding: 'utf-8', timeout: 5000 }).trim()
    results.push(gitVer)
  } catch { /* skip */ }
  results.push(`OS: ${process.platform} ${process.arch}`)
  results.push(`Shell: ${process.env.SHELL || process.env.COMSPEC || 'unknown'}`)
  results.push(`CWD: ${cwd}`)
  results.push(`Home: ${process.env.HOME || process.env.USERPROFILE || 'unknown'}`)
  return results.join('\n')
}

// In-memory session todo list
const sessionTodos: Array<{ id: number; task: string; priority: string; completed: boolean }> = []
let todoNextId = 1

function todoManager(args: Record<string, any>, cwd: string): string {
  const action = args.action
  switch (action) {
    case 'add': {
      if (!args.task) return 'Error: task description required'
      const priority = args.priority || 'medium'
      sessionTodos.push({ id: todoNextId++, task: args.task, priority, completed: false })
      return `Added task #${todoNextId - 1}: ${args.task} [${priority}]`
    }
    case 'list': {
      if (sessionTodos.length === 0) return 'No tasks in the session todo list'
      const lines = sessionTodos.map(t => {
        const status = t.completed ? '✓' : '○'
        const prio = t.priority === 'high' ? '🔴' : t.priority === 'low' ? '🟢' : '🟡'
        return `  ${status} #${t.id} ${prio} ${t.task}`
      })
      return `Session Todo List (${sessionTodos.filter(t => t.completed).length}/${sessionTodos.length} done)\n${lines.join('\n')}`
    }
    case 'complete': {
      const id = parseInt(args.task, 10)
      if (isNaN(id)) return 'Error: task ID required'
      const task = sessionTodos.find(t => t.id === id)
      if (!task) return `Error: task #${id} not found`
      task.completed = true
      return `Completed task #${id}: ${task.task}`
    }
    case 'remove': {
      const rid = parseInt(args.task, 10)
      if (isNaN(rid)) return 'Error: task ID required'
      const idx = sessionTodos.findIndex(t => t.id === rid)
      if (idx === -1) return `Error: task #${rid} not found`
      const removed = sessionTodos.splice(idx, 1)[0]
      return `Removed task #${rid}: ${removed.task}`
    }
    default:
      return `Error: unknown action "${action}". Use: add, list, complete, remove`
  }
}

function diffView(args: Record<string, any>, cwd: string): string {
  if (!existsSync(resolve(cwd, '.git'))) return 'Not a git repository'
  try {
    const fileArg = args.file ? ` -- "${args.file}"` : ''
    const stagedArg = args.staged ? '--cached' : ''
    const diff = execSync(`git diff ${stagedArg}${fileArg}`, { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    if (!diff.trim()) return 'No changes to show'
    if (diff.length > 30000) return diff.slice(0, 30000) + '\n... (truncated, use file parameter to see specific files)'
    return diff
  } catch (err: any) {
    return `Error: ${err.message}`
  }
}

// In-memory session memory store
const sessionMemory: Record<string, string> = {}

function memoryManager(args: Record<string, any>, cwd: string): string {
  const action = args.action
  switch (action) {
    case 'save': {
      if (!args.key || !args.value) return 'Error: key and value required'
      sessionMemory[args.key] = args.value
      return `Saved: ${args.key} = ${args.value.slice(0, 100)}${args.value.length > 100 ? '...' : ''}`
    }
    case 'recall': {
      if (!args.key) return 'Error: key required'
      const val = sessionMemory[args.key]
      if (!val) return `No memory found for key: ${args.key}`
      return `${args.key} = ${val}`
    }
    case 'list': {
      const keys = Object.keys(sessionMemory)
      if (keys.length === 0) return 'No memories stored'
      return `Session Memories (${keys.length}):\n${keys.map(k => `  ${k}: ${sessionMemory[k].slice(0, 80)}${sessionMemory[k].length > 80 ? '...' : ''}`).join('\n')}`
    }
    case 'clear': {
      const count = Object.keys(sessionMemory).length
      for (const k of Object.keys(sessionMemory)) delete sessionMemory[k]
      return `Cleared ${count} memories`
    }
    default:
      return `Error: unknown action "${action}". Use: save, recall, list, clear`
  }
}

function codeReview(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) return `Error: file not found: ${filePath}`
  const stat = statSync(filePath)
  if (stat.isDirectory()) return `Error: ${filePath} is a directory. Use a file path.`
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const ext = extname(filePath)
  const issues: string[] = []

  // Check for common issues
  const focus = args.focus || 'all'

  if (focus === 'all' || focus === 'bugs') {
    // Check for empty catch blocks
    const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*\}/g
    let match
    while ((match = emptyCatchRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length
      issues.push(`🐛 Line ${line}: Empty catch block — errors are silently swallowed`)
    }

    // Check for TODO/FIXME/HACK comments
    const todoRegex = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[\s:]+(.+)/gi
    while ((match = todoRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length
      issues.push(`📝 Line ${line}: ${match[1]} — ${match[2].trim()}`)
    }

    // Check for console.log in production code
    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
      const consoleRegex = /console\.(log|debug|info|warn)\(/g
      while ((match = consoleRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length
        issues.push(`⚠️ Line ${line}: ${match[0]} — consider removing for production`)
      }
    }

    // Check for any type usage
    if (ext === '.ts' || ext === '.tsx') {
      const anyRegex = /:\s*any\b/g
      while ((match = anyRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length
        issues.push(`🔧 Line ${line}: \`any\` type — consider using a more specific type`)
      }
    }

    // Check for very long lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 120) {
        issues.push(`📏 Line ${i + 1}: Line too long (${lines[i].length} chars) — consider breaking up`)
      }
    }

    // Check for very long functions
    let functionStart = -1
    let functionDepth = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.match(/function\s+\w+|=>\s*\{|const\s+\w+\s*=\s*(async\s+)?\(/)) {
        if (functionDepth === 0) functionStart = i
      }
      functionDepth += (line.match(/\{/g) || []).length
      functionDepth -= (line.match(/\}/g) || []).length
      if (functionDepth <= 0 && functionStart >= 0) {
        if (i - functionStart > 50) {
          issues.push(`📐 Lines ${functionStart + 1}-${i + 1}: Long function (${i - functionStart + 1} lines) — consider breaking into smaller functions`)
        }
        functionStart = -1
        functionDepth = 0
      }
    }
  }

  if (focus === 'all' || focus === 'security') {
    // Check for hardcoded secrets
    const secretRegex = /(password|secret|token|api_key|apikey)\s*[=:]\s*['"][^'"]+['"]/gi
    let match
    while ((match = secretRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length
      issues.push(`🔒 Line ${line}: Possible hardcoded secret — use environment variables instead`)
    }

    // Check for eval usage
    const evalRegex = /\beval\s*\(/g
    while ((match = evalRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length
      issues.push(`🚨 Line ${line}: eval() usage — major security risk, avoid if possible`)
    }
  }

  if (focus === 'all' || focus === 'performance') {
    // Check for synchronous operations in async context
    const syncReadRegex = /readFileSync|writeFileSync|existsSync|readdirSync|statSync/g
    let match
    while ((match = syncReadRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length
      issues.push(`⚡ Line ${line}: ${match[0]} — synchronous I/O, consider async version for better performance`)
    }
  }

  // Summary
  const summary = [`📋 Code Review: ${filePath}`, `   ${lines.length} lines | ${ext} | ${issues.length} issues found`, '']
  if (issues.length === 0) {
    summary.push('✅ No issues found! Code looks clean.')
  } else {
    for (const issue of issues.slice(0, 30)) {
      summary.push(`   ${issue}`)
    }
    if (issues.length > 30) {
      summary.push(`   ... and ${issues.length - 30} more issues`)
    }
  }

  return summary.join('\n')
}

function summarize(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  const depth = args.depth || 2

  if (!existsSync(filePath)) return `Error: path not found: ${filePath}`
  const stat = statSync(filePath)

  if (stat.isDirectory()) {
    // Summarize directory
    try {
      const entries = readdirSync(filePath).filter(e => !e.startsWith('.') && e !== 'node_modules' && e !== 'dist')
      const files = entries.filter(e => !statSync(resolve(filePath, e)).isDirectory())
      const dirs = entries.filter(e => statSync(resolve(filePath, e)).isDirectory())

      const summary = [`📁 Directory: ${filePath}`, `   ${files.length} files, ${dirs.length} directories`, '']

      if (depth >= 2) {
        // Group by extension
        const extGroups: Record<string, string[]> = {}
        for (const f of files) {
          const ext = extname(f) || 'no-ext'
          if (!extGroups[ext]) extGroups[ext] = []
          extGroups[ext].push(f)
        }
        for (const [ext, names] of Object.entries(extGroups).sort((a, b) => b[1].length - a[1].length)) {
          summary.push(`   ${ext} (${names.length}): ${names.slice(0, 8).join(', ')}${names.length > 8 ? ' ...' : ''}`)
        }
        if (dirs.length > 0) {
          summary.push(`   Subdirectories: ${dirs.join(', ')}`)
        }
      }

      return summary.join('\n')
    } catch (err: any) {
      return `Error: ${err.message}`
    }
  }

  // Summarize file
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const ext = extname(filePath)
  const sizeKB = (stat.size / 1024).toFixed(1)

  const summary = [`📄 File: ${filePath}`, `   ${lines.length} lines | ${sizeKB}KB | ${ext}`, '']

  if (depth >= 2) {
    // Detect imports/exports
    const imports = lines.filter(l => l.trim().startsWith('import '))
    const exports = lines.filter(l => l.trim().startsWith('export '))
    const functions = lines.filter(l => l.match(/function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(|=>\s*\{/))
    const classes = lines.filter(l => l.match(/class\s+\w+/))

    if (imports.length > 0) summary.push(`   📥 ${imports.length} imports`)
    if (exports.length > 0) summary.push(`   📤 ${exports.length} exports`)
    if (functions.length > 0) summary.push(`   ⚙️ ${functions.length} functions`)
    if (classes.length > 0) summary.push(`   🏗️ ${classes.length} classes`)
  }

  if (depth >= 3) {
    summary.push('')
    summary.push('   First 10 lines:')
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      summary.push(`   ${i + 1}: ${lines[i]}`)
    }
  }

  return summary.join('\n')
}

function projectMap(args: Record<string, any>, cwd: string): string {
  const format = args.format || 'text'
  const parts: string[] = []

  // Detect project type
  const pkgPath = resolve(cwd, 'package.json')
  const isNode = existsSync(pkgPath)
  const isPython = existsSync(resolve(cwd, 'pyproject.toml')) || existsSync(resolve(cwd, 'setup.py'))
  const isRust = existsSync(resolve(cwd, 'Cargo.toml'))
  const isGo = existsSync(resolve(cwd, 'go.mod'))

  if (format === 'mermaid') {
    parts.push('```mermaid')
    parts.push('graph TD')
    if (isNode) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        parts.push(`  root["${pkg.name || 'project'}@${pkg.version || '0.0.0'}"]`)
        // Try to find source directories
        const srcDir = resolve(cwd, 'src')
        if (existsSync(srcDir)) {
          const files = readdirSync(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))
          for (const f of files.slice(0, 15)) {
            parts.push(`  src_${f.replace(/\./g, '_')}["${f}"]`)
            parts.push(`  root --> src_${f.replace(/\./g, '_')}`)
          }
        }
      } catch { /* skip */ }
    }
    parts.push('```')
    return parts.join('\n')
  }

  // Text format
  parts.push('🗺️ Project Map')
  parts.push('')

  if (isNode) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      parts.push(`📦 ${pkg.name || 'unnamed'}@${pkg.version || '0.0.0'}`)
      if (pkg.description) parts.push(`   ${pkg.description}`)
      parts.push('')

      // Source structure
      const srcDir = resolve(cwd, 'src')
      if (existsSync(srcDir)) {
        parts.push('📁 src/')
        try {
          const files = readdirSync(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx'))
          for (const f of files.sort()) {
            const fullPath = resolve(srcDir, f)
            try {
              const stat = statSync(fullPath)
              const sizeKB = (stat.size / 1024).toFixed(1)
              const content = readFileSync(fullPath, 'utf-8')
              const lineCount = content.split('\n').length
              // Detect exports
              const exports = content.match(/export\s+(function|class|const|interface|type|default)\s+\w+/g) || []
              const exportNames = exports.map(e => e.replace(/export\s+(function|class|const|interface|type|default)\s+/, ''))
              parts.push(`   ├── ${f} (${lineCount} lines, ${sizeKB}KB)`)
              if (exportNames.length > 0) {
                parts.push(`   │   exports: ${exportNames.slice(0, 5).join(', ')}${exportNames.length > 5 ? ' ...' : ''}`)
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  if (isPython) parts.push('🐍 Python project detected')
  if (isRust) parts.push('🦀 Rust project detected')
  if (isGo) parts.push('🐹 Go project detected')

  // Config files
  const configFiles = ['tsconfig.json', '.eslintrc.json', '.prettierrc', 'vite.config.ts', 'next.config.js', 'jest.config.ts', 'docker-compose.yml', 'Dockerfile']
  const foundConfigs = configFiles.filter(f => existsSync(resolve(cwd, f)))
  if (foundConfigs.length > 0) {
    parts.push('')
    parts.push(`⚙️ Config files: ${foundConfigs.join(', ')}`)
  }

  return parts.join('\n')
}

// ── Action tool implementations (return structured data for rendering) ──

function thinkAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'think', thoughts: args.thoughts, confidence: args.confidence || 'medium' })
}

function suggestAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'suggest', suggestions: args.suggestions })
}

function followUpAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'follow_up', questions: args.questions })
}

function planAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'plan', goal: args.goal, steps: args.steps })
}

function noteAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'note', message: args.message, level: args.level || 'info' })
}

function questionAction(args: Record<string, any>): string {
  return JSON.stringify({ action: 'question', question: args.question, options: args.options, reason: args.reason })
}

export async function executeTool(
  name: string,
  args: Record<string, any>,
  cwd: string,
): Promise<{ success: boolean; output: string; isAction: boolean }> {
  try {
    // Action tools
    switch (name) {
      case 'think': return { success: true, output: thinkAction(args), isAction: true }
      case 'suggest': return { success: true, output: suggestAction(args), isAction: true }
      case 'follow_up': return { success: true, output: followUpAction(args), isAction: true }
      case 'plan': return { success: true, output: planAction(args), isAction: true }
      case 'note': return { success: true, output: noteAction(args), isAction: true }
      case 'question': return { success: true, output: questionAction(args), isAction: true }
    }
    // Coding tools
    let output: string
    switch (name) {
      case 'read_file': output = readFile(args, cwd); break
      case 'write_file': output = writeFile(args, cwd); break
      case 'edit_file': output = editFile(args, cwd); break
      case 'bash': output = bashCommand(args, cwd); break
      case 'list_files': output = await listFiles(args, cwd); break
      case 'search_files': output = await searchFiles(args, cwd); break
      case 'glob_find': output = await globFind(args, cwd); break
      case 'tree': output = tree(args, cwd); break
      case 'diagnose': output = diagnose(args, cwd); break
      case 'web_fetch': output = webFetch(args, cwd); break
      case 'git_status': output = gitStatus(args, cwd); break
      case 'env_info': output = envInfo(args, cwd); break
      case 'todo': output = todoManager(args, cwd); break
      case 'diff_view': output = diffView(args, cwd); break
      case 'memory': output = memoryManager(args, cwd); break
      case 'code_review': output = codeReview(args, cwd); break
      case 'summarize': output = summarize(args, cwd); break
      case 'project_map': output = projectMap(args, cwd); break
      default: return { success: false, output: `Unknown tool: ${name}`, isAction: false }
    }
    return { success: true, output, isAction: false }
  } catch (err: any) {
    return { success: false, output: `Error executing ${name}: ${err.message}`, isAction: false }
  }
}
