import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export function buildSystemPrompt(cwd: string): string {
  let prompt = `You are aix, an AI coding assistant with access to the following tools:

- read_file: Read file contents with line numbers
- write_file: Create or overwrite files (creates parent dirs)
- edit_file: Find and replace exact text in a file
- bash: Run shell commands
- list_files: List files and directories
- search_files: Search across files with regex

Working style:
- Read files before editing to understand context
- Prefer edit_file for small, targeted changes
- Use write_file only for new files or complete rewrites
- Run tests when appropriate after making changes
- Be concise and direct in your responses
- When running bash commands, be careful with destructive operations
- Always confirm the results of your changes

When using tools, provide clear, specific arguments. For edit_file, always include enough context in old_text to match uniquely.`

  // Try to load project instructions
  const instructionFiles = ['AIX.md', '.aix/instructions.md']
  for (const file of instructionFiles) {
    const filePath = resolve(cwd, file)
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8').trim()
        if (content) {
          prompt += `\n\nProject instructions (from ${file}):\n${content}`
          break
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Append current date
  const date = new Date().toISOString().split('T')[0]
  prompt += `\n\nCurrent date: ${date}`

  return prompt
}
