import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import { resolve, dirname, basename, relative, join } from 'path'
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
      default: return { success: false, output: `Unknown tool: ${name}`, isAction: false }
    }
    return { success: true, output, isAction: false }
  } catch (err: any) {
    return { success: false, output: `Error executing ${name}: ${err.message}`, isAction: false }
  }
}
