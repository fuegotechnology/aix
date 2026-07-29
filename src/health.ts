import { providers, getProvider, FREE_NO_KEY_IDS } from './providers.js'
import type { Provider } from './providers.js'
import { getApiKey, resolveModel } from './providers.js'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'

const AIX_DIR = resolve(homedir(), '.aix')
const HEALTH_CACHE_FILE = join(AIX_DIR, 'provider-health.json')

export interface ProviderHealthResult {
  providerId: string
  providerName: string
  model: string
  healthy: boolean
  latencyMs: number
  error?: string
  checkedAt: string
}

export interface ProviderHealthCache {
  results: ProviderHealthResult[]
  lastFullCheck: string
}

export async function checkProviderHealth(provider: Provider): Promise<ProviderHealthResult> {
  const apiKey = getApiKey(provider)
  const model = resolveModel(provider)
  const startTime = Date.now()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey && apiKey !== 'no-key-required') {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    })

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      let detail = ''
      try { const data = await response.json() as any; detail = data.error?.message || '' } catch { /* ok */ }
      return {
        providerId: provider.id,
        providerName: provider.name,
        model,
        healthy: false,
        latencyMs,
        error: `HTTP ${response.status}: ${detail}`.slice(0, 100),
        checkedAt: new Date().toISOString(),
      }
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      model,
      healthy: true,
      latencyMs,
      checkedAt: new Date().toISOString(),
    }
  } catch (err: any) {
    return {
      providerId: provider.id,
      providerName: provider.name,
      model,
      healthy: false,
      latencyMs: Date.now() - startTime,
      error: err.message?.slice(0, 100) || 'Unknown error',
      checkedAt: new Date().toISOString(),
    }
  }
}

export async function checkAllNoKeyProviders(limit: number = 10): Promise<ProviderHealthResult[]> {
  const results: ProviderHealthResult[] = []
  // Check in batches of 5
  const ids = FREE_NO_KEY_IDS.slice(0, limit)
  for (let i = 0; i < ids.length; i += 5) {
    const batch = ids.slice(i, i + 5)
    const batchResults = await Promise.all(
      batch.map(id => {
        const p = getProvider(id)
        return p ? checkProviderHealth(p) : Promise.resolve(null)
      })
    )
    for (const r of batchResults) {
      if (r) results.push(r)
    }
  }

  // Save to cache
  const cache: ProviderHealthCache = {
    results,
    lastFullCheck: new Date().toISOString(),
  }
  try {
    mkdirSync(AIX_DIR, { recursive: true })
    writeFileSync(HEALTH_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch { /* ok */ }

  return results
}

export function loadHealthCache(): ProviderHealthCache | null {
  if (!existsSync(HEALTH_CACHE_FILE)) return null
  try {
    return JSON.parse(readFileSync(HEALTH_CACHE_FILE, 'utf-8'))
  } catch { return null }
}

export function getBestProvider(): Provider | null {
  const cache = loadHealthCache()
  if (!cache || !cache.results) return null

  // Only use results from last 30 minutes
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000
  const recent = cache.results.filter(r => {
    const checkedAt = new Date(r.checkedAt).getTime()
    return r.healthy && checkedAt > thirtyMinAgo
  })

  if (recent.length === 0) return null

  // Sort by latency (fastest first)
  recent.sort((a, b) => a.latencyMs - b.latencyMs)

  const best = recent[0]
  return getProvider(best.providerId) || null
}

export function renderHealthResults(results: ProviderHealthResult[]): string {
  const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', brightCyan: '\x1b[96m', brightGreen: '\x1b[92m',
    brightRed: '\x1b[91m', gray: '\x1b[90m',
  }

  const lines: string[] = []
  lines.push('')
  lines.push(`  ${C.bold}${C.cyan}◆ Provider Health Check${C.reset} ${C.dim}(${results.length} providers)${C.reset}`)
  lines.push('')

  const healthy = results.filter(r => r.healthy)
  const unhealthy = results.filter(r => !r.healthy)

  lines.push(`  ${C.brightGreen}${healthy.length} healthy${C.reset}  ${C.brightRed}${unhealthy.length} unhealthy${C.reset}`)
  lines.push('')

  // Show healthy providers sorted by latency
  if (healthy.length > 0) {
    lines.push(`  ${C.green}${C.bold}Healthy Providers (sorted by speed)${C.reset}`)
    healthy.sort((a, b) => a.latencyMs - b.latencyMs)
    for (const r of healthy) {
      const latency = r.latencyMs < 1000 ? `${r.latencyMs}ms` : `${(r.latencyMs / 1000).toFixed(1)}s`
      const latencyColor = r.latencyMs < 2000 ? C.brightGreen : r.latencyMs < 5000 ? C.yellow : C.red
      lines.push(`  ${C.green}✓${C.reset} ${C.bold}${r.providerId.padEnd(16)}${C.reset} ${r.providerName.padEnd(20)} ${latencyColor}${latency.padStart(8)}${C.reset} ${C.dim}${r.model}${C.reset}`)
    }
    lines.push('')
  }

  // Show unhealthy providers
  if (unhealthy.length > 0) {
    lines.push(`  ${C.red}${C.bold}Unhealthy Providers${C.reset}`)
    for (const r of unhealthy) {
      const error = r.error ? ` — ${r.error.slice(0, 50)}` : ''
      lines.push(`  ${C.red}✗${C.reset} ${C.bold}${r.providerId.padEnd(16)}${C.reset} ${r.providerName.padEnd(20)} ${C.dim}${error}${C.reset}`)
    }
    lines.push('')
  }

  // Show best provider
  if (healthy.length > 0) {
    const best = healthy[0]
    lines.push(`  ${C.brightCyan}⚡ Fastest: ${C.bold}${best.providerId}${C.reset} ${C.dim}(${best.latencyMs}ms)${C.reset}`)
    lines.push(`  ${C.dim}Use: aix -p ${best.providerId}${C.reset}`)
  }

  return lines.join('\n')
}
