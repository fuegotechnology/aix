import type { Provider } from './providers.js'
import { getApiKey, resolveModel } from './providers.js'
import { streamChat, type Message, type Tool, type StreamChunk } from './llm.js'

export type { Message }
import { TOOLS, executeTool } from './tools.js'

export interface AgentOptions {
  provider: Provider
  userMessage: string
  history: Message[]
  cwd: string
  systemPrompt: string
  maxTurns?: number
  noTools?: boolean
  onChunk?: (chunk: AgentChunk) => void
  signal?: AbortSignal
}

export type AgentChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string; id: string }
  | { type: 'tool_result'; name: string; id: string; success: boolean; output: string }
  | { type: 'turn_done'; inputTokens: number; outputTokens: number }
  | { type: 'error'; error: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; turns: number }

export interface AgentResult {
  messages: Message[]
  text: string
  turns: number
  inputTokens: number
  outputTokens: number
  error?: string
}

export async function runAgent(opts: AgentOptions): Promise<AgentResult> {
  const { provider, userMessage, history, cwd, systemPrompt, noTools, onChunk, signal } = opts
  const maxTurns = opts.maxTurns ?? 20

  const apiKey = getApiKey(provider)
  const model = resolveModel(provider)

  // Check if model supports tools
  const modelInfo = provider.models.find(m => m.id === model)
  const supportsTools = modelInfo ? modelInfo.supportsTools : true
  const useTools = !noTools && supportsTools

  const tools: Tool[] = useTools ? TOOLS : []

  // Build messages
  const messages: Message[] = [...history, { role: 'user', content: userMessage }]

  let fullText = ''
  let turns = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let turn = 0; turn < maxTurns; turn++) {
    turns++
    let text = ''
    let toolCalls: Array<{ id: string; name: string; arguments: string }> = []
    let turnInputTokens = 0
    let turnOutputTokens = 0

    try {
      for await (const chunk of streamChat(provider, apiKey, {
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        systemPrompt: turn === 0 ? systemPrompt : undefined,
        signal,
      })) {
        switch (chunk.type) {
          case 'text':
            text += chunk.text
            onChunk?.({ type: 'text', text: chunk.text })
            break
          case 'tool_call_start':
            onChunk?.({ type: 'tool_start', name: chunk.name, id: chunk.id })
            break
          case 'tool_call_end':
            toolCalls.push({
              id: chunk.id,
              name: chunk.name,
              arguments: chunk.arguments,
            })
            break
          case 'done':
            turnInputTokens = chunk.inputTokens || 0
            turnOutputTokens = chunk.outputTokens || 0
            totalInputTokens += turnInputTokens
            totalOutputTokens += turnOutputTokens
            break
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error'
      onChunk?.({ type: 'error', error: errorMsg })
      return {
        messages,
        text: fullText + text,
        turns,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        error: errorMsg,
      }
    }

    // Add assistant message
    const assistantMsg: Message = {
      role: 'assistant',
      content: text,
    }
    if (toolCalls.length > 0) {
      assistantMsg.tool_calls = toolCalls.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }))
    }
    messages.push(assistantMsg)

    onChunk?.({
      type: 'turn_done',
      inputTokens: turnInputTokens,
      outputTokens: turnOutputTokens,
    })

    fullText += text

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      break
    }

    // Execute tool calls
    for (const tc of toolCalls) {
      let args: Record<string, any>
      try {
        args = JSON.parse(tc.arguments)
      } catch {
        args = {}
      }
      const result = await executeTool(tc.name, args, cwd)
      onChunk?.({
        type: 'tool_result',
        name: tc.name,
        id: tc.id,
        success: result.success,
        output: result.output,
      })
      messages.push({
        role: 'tool',
        content: result.output,
        tool_call_id: tc.id,
        name: tc.name,
      })
    }
  }

  // Keep history bounded to last 40 messages
  const boundedMessages = messages.length > 40 ? messages.slice(-40) : messages

  return {
    messages: boundedMessages,
    text: fullText,
    turns,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
  }
}
