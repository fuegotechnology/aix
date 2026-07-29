import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import { resolve, dirname, basename, relative, join } from 'path'
import { glob } from 'glob'
import type { Tool } from './llm.js'

export const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file with line numbers. Supports reading specific line ranges. Use this to understand existing code before making changes.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file (relative to project root or absolute)' },
          start_line: { type: 'number', description: 'Starting line number (1-based, inclusive)' },
          end_line: { type: 'number', description: 'Ending line number (1-based, inclusive)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file with the given content. Creates parent directories automatically. Use for new files or complete rewrites. For targeted edits, prefer edit_file instead.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          content: { type: 'string', description: 'Full content to write to the file' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Find and replace exact text in a file. Use this for targeted, precise edits. Returns error if old_text is not found. Always include enough context in old_text to match uniquely.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          old_text: { type: 'string', description: 'Exact text to find in the file (must match exactly)' },
          new_text: { type: 'string', description: 'Text to replace old_text with' },
        },
        required: ['path', 'old_text', 'new_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Run a bash command in the project directory. Returns stdout, or combined stdout+stderr on error. Use for running tests, installing packages, git operations, and any shell tasks.',
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
      description: 'List files and directories in a path. Supports glob patterns, recursion, and file size display. Ignores node_modules, .git, dist, __pycache__, .venv.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: .)' },
          recursive: { type: 'boolean', description: 'List recursively (default: false)' },
          pattern: { type: 'string', description: 'Glob pattern to filter files (e.g. "**/*.ts")' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search across files for a regex pattern. Returns up to 50 matches with file, line number, and content. Powerful for finding usages, imports, and patterns.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          path: { type: 'string', description: 'Directory to search in (default: .)' },
          file_pattern: { type: 'string', description: 'Glob pattern for files to search (e.g. "**/*.ts")' },
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
      description: 'Find files matching a glob pattern. Returns file paths relative to the search directory. Faster than list_files for pattern-based searches.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g. "**/*.test.ts", "src/**/*.js")' },
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
      description: 'Display a directory tree structure. Useful for understanding project layout and structure at a glance.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: .)' },
          max_depth: { type: 'number', description: 'Maximum depth to traverse (default: 3)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'diagnose',
      description: 'Run diagnostic checks on the project. Checks for common issues like missing dependencies, TypeScript errors, lint problems, and test failures.',
      parameters: {
        type: 'object',
        properties: {
          checks: {
            type: 'string',
            description: 'Which checks to run: "all", "deps", "types", "lint", "tests" (default: "all")',
          },
        },
      },
    },
  },
]

// ── Tool implementations ──

function readFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) {
    return `Error: file not found: ${filePath}`
  }
  const stat = statSync(filePath)
  if (stat.isDirectory()) {
    return `Error: ${filePath} is a directory, not a file. Use list_files or tree instead.`
  }
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
  return existed
    ? `Updated ${filePath} (${lineCount} lines, ${sizeStr})`
    : `Created ${filePath} (${lineCount} lines, ${sizeStr})`
}

function editFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) {
    return `Error: file not found: ${filePath}`
  }
  const content = readFileSync(filePath, 'utf-8')
  const oldLines = content.split('\n').length
  const index = content.indexOf(args.old_text)
  if (index === -1) {
    // Try to give helpful context about what's in the file
    const lines = content.split('\n')
    const preview = lines.slice(0, 5).map((l, i) => `${i + 1}: ${l}`).join('\n')
    return `Error: old_text not found in ${filePath}\n\nFile starts with:\n${preview}\n\nMake sure old_text matches exactly (including whitespace and indentation).`
  }
  // Check for multiple matches
  const secondIndex = content.indexOf(args.old_text, index + 1)
  if (secondIndex !== -1) {
    return `Error: old_text found multiple times in ${filePath}. Please include more surrounding context to make the match unique.`
  }
  const newContent = content.replace(args.old_text, args.new_text)
  writeFileSync(filePath, newContent, 'utf-8')
  const newLines = newContent.split('\n').length
  const diff = newLines - oldLines
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`
  return `Edited ${filePath} (${diffStr} lines, ${oldLines} → ${newLines})`
}

function bashCommand(args: Record<string, any>, cwd: string): string {
  const command = args.command
  // Block dangerous patterns
  const dangerous = /rm\s+-rf\s+\/\s*$|^sudo\s+rm\s|>\s*\/dev\/(sda|hda|nvme|disk)|mkfs\.|dd\s+if=|:\(\)\{.*;\};\s*:\s*|chmod\s+-R\s+777\s+\//
  if (dangerous.test(command)) {
    return `Error: command blocked for safety: ${command}\nIf this is a mistake, please run the command manually.`
  }
  const timeoutSec = Math.min(args.timeout || 30, 120)
  const timeoutMs = timeoutSec * 1000
  try {
    const result = execSync(command, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
    })
    return result || '(no output)'
  } catch (err: any) {
    const output = (err.stdout || '') + (err.stderr || '')
    if (err.killed) {
      return `Error: command timed out after ${timeoutSec}s\n${output}`
    }
    return output || `Error: ${err.message}`
  }
}

async function listFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  if (!existsSync(dir)) {
    return `Error: directory not found: ${dir}`
  }
  const pattern = args.pattern || (args.recursive ? '**/*' : '*')
  const files = await glob(pattern, {
    cwd: dir,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**', '.next/**', '.nuxt/**', 'build/**', 'coverage/**', '.cache/**'],
  })
  if (files.length === 0) {
    return `No files found in ${dir} matching "${pattern}"`
  }
  const lines = files.slice(0, 200).map(f => {
    try {
      const stat = statSync(resolve(dir, f))
      const size = stat.size < 1024 ? `${stat.size}B` : stat.size < 1048576 ? `${(stat.size / 1024).toFixed(1)}KB` : `${(stat.size / 1048576).toFixed(1)}MB`
      return `${f}  ${dim(size)}`
    } catch {
      return f
    }
  })
  const suffix = files.length > 200 ? `\n... and ${files.length - 200} more files` : ''
  return `${dir} (${files.length} files)\n${lines.join('\n')}${suffix}`
}

function dim(s: string): string {
  return s
}

async function searchFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const filePattern = args.file_pattern || '**/*.{ts,js,tsx,jsx,py,md,txt,json,yaml,yml,toml,rs,go,java,c,cpp,h,hpp,rb,php,sh,sql,html,css,scss,vue,svelte,astro,swift,kt,scala,dart,zig,lean,hs,ml,ex,exs,erl,clj,cljs,hs,lhs}'
  const caseSensitive = args.case_sensitive || false
  const flags = caseSensitive ? 'g' : 'gi'
  let regex: RegExp
  try {
    regex = new RegExp(args.pattern, flags)
  } catch {
    return `Error: invalid regex pattern: ${args.pattern}`
  }
  const files = await glob(filePattern, {
    cwd: dir,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  })
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
          if (trimmed.length > 200) {
            matches.push(`${file}:${i + 1}: ${trimmed.slice(0, 200)}...`)
          } else {
            matches.push(`${file}:${i + 1}: ${trimmed}`)
          }
        }
        regex.lastIndex = 0
      }
    } catch {
      // Skip unreadable files
    }
  }
  if (matches.length === 0) {
    return `No matches found for "${args.pattern}" in ${dir}`
  }
  return `Found ${matches.length} matches for "${args.pattern}" in ${dir}\n${matches.join('\n')}`
}

async function globFind(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const files = await glob(args.pattern, {
    cwd: dir,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**'],
  })
  if (files.length === 0) {
    return `No files matching "${args.pattern}" in ${dir}`
  }
  return files.slice(0, 100).join('\n')
}

function tree(args: Record<string, any>, cwd: string): string {
  const dir = resolve(cwd, args.path || '.')
  const maxDepth = args.max_depth || 3
  if (!existsSync(dir)) {
    return `Error: directory not found: ${dir}`
  }
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', '__pycache__', '.venv', '.next', '.nuxt', 'build', 'coverage', '.cache', '.turbo', '.parcel-cache', 'target', 'out', '.output'])

  function buildTree(currentPath: string, prefix: string, depth: number): string {
    if (depth > maxDepth) return ''
    let result = ''
    try {
      const entries = readdirSync(currentPath, { withFileTypes: true })
        .filter(e => !ignoreDirs.has(e.name) && !e.name.startsWith('.'))
        .sort((a, b) => {
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
          const newPrefix = prefix + (isLast ? '    ' : '│   ')
          result += buildTree(join(currentPath, entry.name), newPrefix, depth + 1)
        }
      }

      if (hidden > 0) {
        result += `${prefix}└── ... (${hidden} more)\n`
      }
    } catch {
      // Permission denied or other error
    }
    return result
  }

  const rootName = basename(dir) || dir
  return `${rootName}/\n${buildTree(dir, '', 1)}`
}

function diagnose(args: Record<string, any>, cwd: string): string {
  const checks = args.checks || 'all'
  const results: string[] = []

  // Check for package.json
  const pkgPath = resolve(cwd, 'package.json')
  const hasPkg = existsSync(pkgPath)
  if (hasPkg) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      results.push(`✓ package.json found: ${pkg.name}@${pkg.version}`)
    } catch {
      results.push('✗ package.json found but could not be parsed')
    }
  } else {
    results.push('✗ No package.json found')
  }

  // Check node_modules
  if (hasPkg) {
    const nmExists = existsSync(resolve(cwd, 'node_modules'))
    results.push(nmExists ? '✓ node_modules exists' : '✗ node_modules missing — run npm install')
  }

  // Check TypeScript
  if (checks === 'all' || checks === 'types') {
    const tsconfigExists = existsSync(resolve(cwd, 'tsconfig.json'))
    results.push(tsconfigExists ? '✓ tsconfig.json found' : '✗ No tsconfig.json found')
    if (tsconfigExists) {
      try {
        const output = execSync('npx tsc --noEmit 2>&1', { cwd, timeout: 30000, encoding: 'utf-8' })
        results.push('✓ TypeScript: no errors')
      } catch (err: any) {
        const output = (err.stdout || '').trim()
        const errorCount = (output.match(/error TS/g) || []).length
        results.push(`✗ TypeScript: ${errorCount} error(s) found`)
        if (errorCount <= 5) {
          results.push(output.split('\n').slice(0, 10).join('\n'))
        }
      }
    }
  }

  // Check linting
  if (checks === 'all' || checks === 'lint') {
    const eslintConfig = existsSync(resolve(cwd, '.eslintrc.json')) || existsSync(resolve(cwd, '.eslintrc.js')) || existsSync(resolve(cwd, 'eslint.config.js')) || existsSync(resolve(cwd, 'eslint.config.mjs'))
    results.push(eslintConfig ? '✓ ESLint config found' : 'ℹ No ESLint config found')
  }

  // Check tests
  if (checks === 'all' || checks === 'tests') {
    try {
      const testFiles = glob.sync('**/*.test.{ts,js,tsx,jsx}', { cwd, ignore: ['node_modules/**'] })
      const specFiles = glob.sync('**/*.spec.{ts,js,tsx,jsx}', { cwd, ignore: ['node_modules/**'] })
      const pyTests = glob.sync('**/test_*.py', { cwd, ignore: ['node_modules/**'] })
      const total = testFiles.length + specFiles.length + pyTests.length
      if (total > 0) {
        results.push(`✓ Found ${total} test file(s)`)
      } else {
        results.push('ℹ No test files found')
      }
    } catch {
      results.push('ℹ Could not check for test files')
    }
  }

  // Check git
  const gitDir = existsSync(resolve(cwd, '.git'))
  results.push(gitDir ? '✓ Git repository found' : 'ℹ Not a git repository')

  // Check for common config files
  const configs = [
    ['.editorconfig', 'EditorConfig'],
    ['.prettierrc', '.prettierrc.json', 'Prettier'],
    ['.gitignore', '.gitignore'],
    ['README.md', 'README'],
  ]
  for (const [file, label] of configs) {
    if (existsSync(resolve(cwd, file))) {
      results.push(`✓ ${label} found`)
    }
  }

  return results.join('\n')
}

export async function executeTool(
  name: string,
  args: Record<string, any>,
  cwd: string,
): Promise<{ success: boolean; output: string }> {
  try {
    let output: string
    switch (name) {
      case 'read_file':
        output = readFile(args, cwd)
        break
      case 'write_file':
        output = writeFile(args, cwd)
        break
      case 'edit_file':
        output = editFile(args, cwd)
        break
      case 'bash':
        output = bashCommand(args, cwd)
        break
      case 'list_files':
        output = await listFiles(args, cwd)
        break
      case 'search_files':
        output = await searchFiles(args, cwd)
        break
      case 'glob_find':
        output = await globFind(args, cwd)
        break
      case 'tree':
        output = tree(args, cwd)
        break
      case 'diagnose':
        output = diagnose(args, cwd)
        break
      default:
        return { success: false, output: `Unknown tool: ${name}` }
    }
    return { success: true, output }
  } catch (err: any) {
    return { success: false, output: `Error executing ${name}: ${err.message}` }
  }
}
