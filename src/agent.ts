import type { Provider } from './providers.js'
import { getApiKey, resolveModel } from './providers.js'
import { streamChat, type Message, type Tool, type StreamChunk } from './llm.js'
import { TOOLS, executeTool, isActionTool } from './tools.js'

export type { Message }

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
  verbose?: boolean
}

export type AgentChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string; id: string }
  | { type: 'tool_result'; name: string; id: string; success: boolean; output: string; isAction: boolean }
  | { type: 'action'; name: string; data: any }
  | { type: 'turn_done'; inputTokens: number; outputTokens: number; turns: number }
  | { type: 'error'; error: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; turns: number; elapsed: number }

export interface AgentResult {
  messages: Message[]
  text: string
  turns: number
  inputTokens: number
  outputTokens: number
  elapsed: number
  error?: string
  toolCallsMade: number
  actionsMade: number
}

export async function runAgent(opts: AgentOptions): Promise<AgentResult> {
  const { provider, userMessage, history, cwd, systemPrompt, noTools, onChunk, signal, verbose } = opts
  const maxTurns = opts.maxTurns ?? 20

  const apiKey = getApiKey(provider)
  const model = resolveModel(provider)

  const modelInfo = provider.models.find(m => m.id === model)
  const supportsTools = modelInfo ? modelInfo.supportsTools : true
  const useTools = !noTools && supportsTools

  const tools: Tool[] = useTools ? TOOLS : []

  const messages: Message[] = [...history, { role: 'user', content: userMessage }]

  let fullText = ''
  let turns = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let toolCallsMade = 0
  let actionsMade = 0
  const startTime = Date.now()

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
            toolCalls.push({ id: chunk.id, name: chunk.name, arguments: chunk.arguments })
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
      return { messages, text: fullText + text, turns, inputTokens: totalInputTokens, outputTokens: totalOutputTokens, elapsed: Date.now() - startTime, error: errorMsg, toolCallsMade, actionsMade }
    }

    // Add assistant message
    const assistantMsg: Message = { role: 'assistant', content: text }
    if (toolCalls.length > 0) {
      assistantMsg.tool_calls = toolCalls.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }))
    }
    messages.push(assistantMsg)

    onChunk?.({ type: 'turn_done', inputTokens: turnInputTokens, outputTokens: turnOutputTokens, turns })

    fullText += text

    // If no tool calls, we're done
    if (toolCalls.length === 0) break

    // Execute tool calls
    let hasCodingToolCalls = false
    for (const tc of toolCalls) {
      let args: Record<string, any>
      try { args = JSON.parse(tc.arguments) } catch { args = {} }

      const result = await executeTool(tc.name, args, cwd)
      const isAction = result.isAction

      if (isAction) {
        // Action tools: parse and emit as action chunk, don't add to conversation
        actionsMade++
        let actionData: any
        try { actionData = JSON.parse(result.output) } catch { actionData = { raw: result.output } }
        onChunk?.({ type: 'action', name: tc.name, data: actionData })
        onChunk?.({ type: 'tool_result', name: tc.name, id: tc.id, success: true, output: result.output, isAction: true })
        // Action tools get a simple acknowledgment back to the model
        messages.push({
          role: 'tool',
          content: `Action displayed to user. Continue with your response.`,
          tool_call_id: tc.id,
          name: tc.name,
        })
      } else {
        // Coding tools: add result to conversation
        toolCallsMade++
        hasCodingToolCalls = true
        onChunk?.({ type: 'tool_result', name: tc.name, id: tc.id, success: result.success, output: result.output, isAction: false })
        messages.push({
          role: 'tool',
          content: result.output,
          tool_call_id: tc.id,
          name: tc.name,
        })
      }
    }

    // If only action tools were called (no coding tools), the model likely wants to continue
    // But if only action tools were used and no text was produced, let it continue
  }

  const boundedMessages = messages.length > 40 ? messages.slice(-40) : messages
  const elapsed = Date.now() - startTime

  onChunk?.({ type: 'done', inputTokens: totalInputTokens, outputTokens: totalOutputTokens, turns, elapsed })

  return { messages: boundedMessages, text: fullText, turns, inputTokens: totalInputTokens, outputTokens: totalOutputTokens, elapsed, toolCallsMade, actionsMade }
}
