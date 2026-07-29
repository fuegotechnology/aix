import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { glob } from 'glob'
import type { Tool } from './llm.js'

export const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file. Returns numbered lines.',
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
      description: 'Create or overwrite a file with the given content. Creates parent directories if needed.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Find exact text in a file and replace it with new text. Returns error if old_text not found.',
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
      description: 'Run a bash command. Returns stdout or combined output on error.',
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
      description: 'List files in a directory. Supports glob patterns and recursion.',
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
]

function readFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) {
    return `Error: file not found: ${filePath}`
  }
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const start = args.start_line ? Math.max(1, args.start_line) : 1
  const end = args.end_line ? Math.min(lines.length, args.end_line) : lines.length
  const selected = lines.slice(start - 1, end)
  const numbered = selected.map((line, i) => `${start + i}: ${line}`).join('\n')
  return `${filePath} (${lines.length} lines, showing ${start}-${end})\n${numbered}`
}

function writeFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  const existed = existsSync(filePath)
  const dir = dirname(filePath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, args.content, 'utf-8')
  const lineCount = args.content.split('\n').length
  return existed
    ? `Updated ${filePath} (${lineCount} lines)`
    : `Created ${filePath} (${lineCount} lines)`
}

function editFile(args: Record<string, any>, cwd: string): string {
  const filePath = resolve(cwd, args.path)
  if (!existsSync(filePath)) {
    return `Error: file not found: ${filePath}`
  }
  const content = readFileSync(filePath, 'utf-8')
  const oldLines = content.split('\n').length
  if (!content.includes(args.old_text)) {
    return `Error: old_text not found in ${filePath}`
  }
  const newContent = content.replace(args.old_text, args.new_text)
  writeFileSync(filePath, newContent, 'utf-8')
  const newLines = newContent.split('\n').length
  const diff = newLines - oldLines
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`
  return `Edited ${filePath} (${diffStr} lines)`
}

function bashCommand(args: Record<string, any>, cwd: string): string {
  const command = args.command
  // Block dangerous patterns
  const dangerous = /rm\s+-rf\s+\/\s*$|^sudo\s+rm\s|>\s*\/dev\/(sda|hda|nvme|disk)/
  if (dangerous.test(command)) {
    return `Error: command blocked for safety: ${command}`
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
    return output || `Error: ${err.message}`
  }
}

async function listFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const pattern = args.pattern || (args.recursive ? '**/*' : '*')
  const fullPattern = args.pattern || (args.recursive ? '**/*' : '*')
  const files = await glob(fullPattern, {
    cwd: dir,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**'],
  })
  if (files.length === 0) {
    return `No files found in ${dir}`
  }
  const lines = files.map(f => {
    try {
      const stat = require('fs').statSync(resolve(dir, f))
      const size = stat.size < 1024 ? `${stat.size}B` : `${(stat.size / 1024).toFixed(1)}KB`
      return `${f} (${size})`
    } catch {
      return f
    }
  })
  return `${dir} (${files.length} files)\n${lines.join('\n')}`
}

async function searchFiles(args: Record<string, any>, cwd: string): Promise<string> {
  const dir = resolve(cwd, args.path || '.')
  const filePattern = args.file_pattern || '**/*.{ts,js,tsx,jsx,py,md,txt,json,yaml,yml,toml,rs,go,java,c,cpp,h,hpp,rb,php,sh,sql,html,css,scss,vue,svelte}'
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
    ignore: ['node_modules/**', '.git/**', 'dist/**', '**/__pycache__/**', '.venv/**'],
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
          matches.push(`${file}:${i + 1}: ${lines[i].trim()}`)
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
      default:
        return { success: false, output: `Unknown tool: ${name}` }
    }
    return { success: true, output }
  } catch (err: any) {
    return { success: false, output: `Error executing ${name}: ${err.message}` }
  }
}
