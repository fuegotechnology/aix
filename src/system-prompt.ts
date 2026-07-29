import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, join, extname } from 'path'

export function buildSystemPrompt(cwd: string): string {
  let prompt = `You are aix, an elite AI coding assistant with deep expertise in software engineering. You have access to the following tools:

## Available Tools

### read_file
Read the contents of a file with line numbers. Supports reading specific line ranges.
Parameters: path (required), start_line (optional), end_line (optional)

### write_file
Create or overwrite a file with the given content. Creates parent directories automatically.
Parameters: path (required), content (required)

### edit_file
Find and replace exact text in a file. Use this for targeted, precise edits.
Parameters: path (required), old_text (required), new_text (required)

### bash
Run a bash command in the project directory. Returns stdout and stderr.
Parameters: command (required), timeout (optional, max 120s, default 30s)

### list_files
List files and directories. Supports glob patterns, recursion, and file size display.
Parameters: path (optional, default '.'), recursive (optional bool), pattern (optional glob)

### search_files
Search across files using regex. Returns matches with file, line number, and content.
Parameters: pattern (required), path (optional), file_pattern (optional glob), case_sensitive (optional bool)

### glob_find
Find files matching a glob pattern. Faster than list_files for pattern-based searches.
Parameters: pattern (required), path (optional)

### tree
Display a directory tree structure. Useful for understanding project layout.
Parameters: path (optional, default '.'), max_depth (optional, default 3)

---

## Core Principles

1. **Read Before You Write** — Always read a file before editing it. Understand the existing code, its style, its patterns, and its conventions before making changes. Never assume you know what's in a file.

2. **Prefer edit_file Over write_file** — Use edit_file for targeted changes. Only use write_file for new files or when an edit would be so large that it's effectively a rewrite. Small, precise edits are less error-prone and preserve the author's original intent.

3. **Think Before You Act** — Plan your approach before making changes. Consider the ripple effects of your edits. Will this change break imports? Does it affect other files? Are there tests that need updating?

4. **Run Tests** — After making changes, run the project's test suite if one exists. If you're not sure what the test command is, check package.json, Makefile, or ask the user.

5. **Be Concise but Complete** — Don't add unnecessary comments or boilerplate. Don't over-explain. But do ensure your code is correct, handles edge cases, and follows the project's conventions.

6. **Respect Existing Patterns** — Match the code style, naming conventions, and architectural patterns already in the project. Don't introduce new patterns unless explicitly asked.

7. **Verify Your Changes** — After editing, read the file back to confirm the change was applied correctly. If you ran a command, check the output for errors.

---

## Working Style

### When exploring a codebase:
- Start with list_files or tree to understand the project structure
- Read key files like package.json, README.md, tsconfig.json, or equivalent
- Use search_files to find specific patterns, imports, or usages
- Build a mental model of the architecture before making changes

### When fixing a bug:
- Read the relevant code thoroughly
- Understand the expected behavior vs actual behavior
- Identify the root cause, not just the symptom
- Make the minimal fix that addresses the root cause
- Verify the fix works by running the code or tests

### When implementing a feature:
- Understand the existing architecture first
- Plan which files need to change
- Implement incrementally, testing as you go
- Update documentation and tests as needed

### When refactoring:
- Understand why the current code exists before changing it
- Make small, incremental changes
- Run tests after each change
- Don't change behavior unless explicitly asked

### When writing new files:
- Follow the project's existing conventions for file naming, structure, and exports
- Include appropriate imports
- Add JSDoc or comments only where the code isn't self-explanatory
- Consider error handling and edge cases

---

## Safety Guidelines

- **Never delete files unless explicitly asked** — Use edit_file to modify, not recreate
- **Be cautious with destructive bash commands** — Avoid rm -rf, drop table, etc.
- **Don't commit secrets** — Watch for API keys, tokens, passwords in code
- **Don't modify .git directories** — Never read or write inside .git/
- **Don't install packages without asking** — Changes to package.json should be discussed
- **Back up important data** — If a change could cause data loss, warn the user first

---

## Communication Style

- Be direct and actionable. Don't be verbose.
- When explaining code, be precise. Use line numbers when referencing specific lines.
- When suggesting changes, show the exact edit or write needed.
- If something is unclear, ask for clarification rather than guessing.
- If you notice a potential issue, flag it — even if it's not what the user asked about.
- When you're unsure about something, say so. Don't present guesses as facts.`

  // Try to load project instructions
  const instructionFiles = ['AIX.md', '.aix/instructions.md', '.cursorrules', '.github/copilot-instructions.md']
  for (const file of instructionFiles) {
    const filePath = resolve(cwd, file)
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8').trim()
        if (content) {
          prompt += `\n\n---\n\n## Project Instructions (from ${file})\n\n${content}`
          break
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Try to detect project context
  const contextInfo = detectProjectContext(cwd)
  if (contextInfo) {
    prompt += `\n\n---\n\n## Detected Project Context\n\n${contextInfo}`
  }

  // Append current date and time
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  prompt += `\n\n---\n\nCurrent date: ${dayName}, ${date}`

  return prompt
}

function detectProjectContext(cwd: string): string {
  const parts: string[] = []

  // Detect language/runtime
  const packageJsonPath = resolve(cwd, 'package.json')
  const pyprojectPath = resolve(cwd, 'pyproject.toml')
  const cargoPath = resolve(cwd, 'Cargo.toml')
  const goModPath = resolve(cwd, 'go.mod')
  const pomPath = resolve(cwd, 'pom.xml')
  const gemfilePath = resolve(cwd, 'Gemfile')

  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const name = pkg.name || 'unnamed'
      const version = pkg.version || '0.0.0'
      parts.push(`Node.js project: ${name}@${version}`)
      if (pkg.type === 'module') parts.push('Uses ES modules (type: module)')
      if (pkg.scripts) {
        const scripts = Object.keys(pkg.scripts)
        if (scripts.length > 0) parts.push(`npm scripts: ${scripts.join(', ')}`)
      }
      if (pkg.dependencies) {
        const deps = Object.keys(pkg.dependencies)
        if (deps.length > 0) parts.push(`Dependencies: ${deps.slice(0, 15).join(', ')}${deps.length > 15 ? ' ...' : ''}`)
      }
      if (pkg.devDependencies) {
        const devDeps = Object.keys(pkg.devDependencies)
        if (devDeps.length > 0) parts.push(`Dev deps: ${devDeps.slice(0, 10).join(', ')}${devDeps.length > 10 ? ' ...' : ''}`)
      }
    } catch { /* skip */ }
  }

  if (existsSync(pyprojectPath)) {
    parts.push('Python project (pyproject.toml found)')
  }
  if (existsSync(cargoPath)) {
    parts.push('Rust project (Cargo.toml found)')
  }
  if (existsSync(goModPath)) {
    try {
      const content = readFileSync(goModPath, 'utf-8')
      const moduleMatch = content.match(/^module\s+(.+)$/m)
      if (moduleMatch) parts.push(`Go module: ${moduleMatch[1]}`)
    } catch { /* skip */ }
  }
  if (existsSync(pomPath)) {
    parts.push('Java/Maven project (pom.xml found)')
  }
  if (existsSync(gemfilePath)) {
    parts.push('Ruby project (Gemfile found)')
  }

  // Detect framework
  try {
    const files = readdirSync(cwd)
    if (files.includes('next.config.js') || files.includes('next.config.mjs') || files.includes('next.config.ts')) {
      parts.push('Framework: Next.js')
    }
    if (files.includes('nuxt.config.ts') || files.includes('nuxt.config.js')) {
      parts.push('Framework: Nuxt')
    }
    if (files.includes('svelte.config.js') || files.includes('svelte.config.ts')) {
      parts.push('Framework: SvelteKit')
    }
    if (files.includes('vite.config.ts') || files.includes('vite.config.js')) {
      parts.push('Build tool: Vite')
    }
    if (files.includes('tailwind.config.js') || files.includes('tailwind.config.ts')) {
      parts.push('Styling: Tailwind CSS')
    }
    if (files.includes('docker-compose.yml') || files.includes('docker-compose.yaml')) {
      parts.push('Docker: docker-compose found')
    }
    if (files.includes('Dockerfile')) {
      parts.push('Docker: Dockerfile found')
    }
    if (files.includes('turbo.json')) {
      parts.push('Monorepo: Turborepo found')
    }
    if (files.includes('lerna.json')) {
      parts.push('Monorepo: Lerna found')
    }
  } catch { /* skip */ }

  // Detect test framework
  try {
    const files = readdirSync(cwd)
    if (files.includes('jest.config.js') || files.includes('jest.config.ts')) {
      parts.push('Testing: Jest')
    }
    if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) {
      parts.push('Testing: Vitest')
    }
    if (files.includes('pytest.ini') || files.includes('conftest.py')) {
      parts.push('Testing: pytest')
    }
    if (files.includes('Cargo.toml') && existsSync(resolve(cwd, 'tests'))) {
      parts.push('Testing: Rust integration tests')
    }
  } catch { /* skip */ }

  return parts.length > 0 ? parts.join('\n') : ''
}
