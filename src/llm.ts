import type { Provider } from './providers.js'

export interface ContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentPart[]
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_call_start'; id: string; name: string; index: number }
  | { type: 'tool_call_delta'; index: number; arguments: string }
  | { type: 'tool_call_end'; index: number; id: string; name: string; arguments: string }
  | { type: 'done'; inputTokens?: number; outputTokens?: number }

export interface LLMOptions {
  model: string
  messages: Message[]
  tools?: Tool[]
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  signal?: AbortSignal
}

export async function* streamChat(
  provider: Provider,
  apiKey: string,
  opts: LLMOptions,
): AsyncGenerator<StreamChunk> {
  const messages: Message[] = []
  if (opts.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt })
  }
  messages.push(...opts.messages)

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  }
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools
  }
  if (opts.maxTokens) {
    body.max_tokens = opts.maxTokens
  }
  if (opts.temperature !== undefined) {
    body.temperature = opts.temperature
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey && apiKey !== 'no-key-required') {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  // OpenRouter specific headers
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/fuegotechnology/aix'
    headers['X-Title'] = 'aix'
  }

  const url = `${provider.baseURL}/chat/completions`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  } catch (err: any) {
    throw new Error(`${provider.name}: request failed — ${err.message}`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`${provider.name}: API error ${response.status} — ${text.slice(0, 500)}`)
  }

  if (!response.body) {
    throw new Error(`${provider.name}: no response body received`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        let chunk: any
        try {
          chunk = JSON.parse(data)
        } catch {
          continue
        }

        if (chunk.usage) {
          // Will emit at the end
        }

        const choice = chunk.choices?.[0]
        if (!choice) continue

        const delta = choice.delta
        if (!delta) continue

        // Text content
        if (delta.content) {
          yield { type: 'text', text: delta.content }
        }

        // Tool calls
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0
            if (tc.id) {
              // Tool call start
              toolCallMap.set(idx, {
                id: tc.id,
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '',
              })
              yield {
                type: 'tool_call_start',
                id: tc.id,
                name: tc.function?.name || '',
                index: idx,
              }
            } else if (tc.function?.arguments) {
              // Tool call delta
              const existing = toolCallMap.get(idx)
              if (existing) {
                existing.arguments += tc.function.arguments
              }
              yield {
                type: 'tool_call_delta',
                index: idx,
                arguments: tc.function.arguments,
              }
            }
          }
        }

        // Finish reason
        if (choice.finish_reason) {
          // Emit tool_call_end for any accumulated tool calls
          for (const [idx, tc] of toolCallMap) {
            yield {
              type: 'tool_call_end',
              index: idx,
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
            }
          }
          toolCallMap.clear()
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield {
    type: 'done',
    inputTokens: undefined,
    outputTokens: undefined,
  }
}

export async function chatOnce(
  provider: Provider,
  apiKey: string,
  opts: LLMOptions,
): Promise<Message> {
  const messages: Message[] = []
  if (opts.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt })
  }
  messages.push(...opts.messages)

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
  }
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools
  }
  if (opts.maxTokens) {
    body.max_tokens = opts.maxTokens
  }
  if (opts.temperature !== undefined) {
    body.temperature = opts.temperature
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey && apiKey !== 'no-key-required') {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/fuegotechnology/aix'
    headers['X-Title'] = 'aix'
  }

  const url = `${provider.baseURL}/chat/completions`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  } catch (err: any) {
    throw new Error(`${provider.name}: request failed — ${err.message}`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`${provider.name}: API error ${response.status} — ${text.slice(0, 500)}`)
  }

  const data = await response.json() as any
  const choice = data.choices?.[0]
  if (!choice?.message) {
    throw new Error(`${provider.name}: no message in response`)
  }
  return choice.message as Message
}
