export interface ProviderModel {
  id: string
  name: string
  contextK: number
  free: boolean
  supportsTools: boolean
  supportsVision: boolean
}

export interface Provider {
  id: string
  name: string
  baseURL: string
  apiKeyEnv: string | null
  defaultModel: string
  freeModels: string[]
  free: boolean
  local: boolean
  models: ProviderModel[]
  description?: string
  website?: string
}

const providers: Provider[] = [
  // ═══════════════════════════════════════════════════════════════
  //  COMPLETELY FREE — No API key needed, no signup, no credit card
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pollinations',
    name: 'Pollinations AI',
    baseURL: 'https://text.pollinations.ai/openai',
    apiKeyEnv: null,
    defaultModel: 'openai-large',
    freeModels: ['openai-large', 'openai', 'mistral', 'deepseek', 'gemini', 'qwen-coder'],
    free: true,
    local: false,
    description: 'Free, no-key AI gateway. Routes to GPT-4o, Mistral, DeepSeek, Gemini, and more.',
    website: 'https://pollinations.ai',
    models: [
      { id: 'openai-large', name: 'GPT-4o', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'openai', name: 'GPT-4o Mini', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'mistral', name: 'Mistral Large', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek', name: 'DeepSeek V3', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'gemini', name: 'Gemini 2.5 Flash', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'qwen-coder', name: 'Qwen Coder 2.5', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'llm7',
    name: 'LLM7.io',
    baseURL: 'https://api.llm7.io/v1',
    apiKeyEnv: null,
    defaultModel: 'gpt-4o',
    freeModels: ['gpt-4o', 'gpt-4o-mini', 'gemini-2.5-flash', 'deepseek-chat'],
    free: true,
    local: false,
    description: 'Free AI gateway providing GPT-4o, Gemini, and DeepSeek — no key required.',
    website: 'https://llm7.io',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FREE TIER — Free API key, no credit card required
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnv: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-pro',
    freeModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    free: true,
    local: false,
    description: 'Google\'s state-of-the-art models with up to 2M context. Free tier with generous limits.',
    website: 'https://aistudio.google.com',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextK: 1048, free: true, supportsTools: true, supportsVision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextK: 1048, free: true, supportsTools: true, supportsVision: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextK: 1048, free: true, supportsTools: true, supportsVision: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextK: 2048, free: true, supportsTools: true, supportsVision: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextK: 1048, free: true, supportsTools: true, supportsVision: true },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
    freeModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    free: true,
    local: false,
    description: 'Ultra-fast inference (LPU). Free tier with generous rate limits. Best for speed.',
    website: 'https://console.groq.com',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextK: 32, free: true, supportsTools: true, supportsVision: false },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextK: 8, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    baseURL: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    defaultModel: 'mistral-large-latest',
    freeModels: ['mistral-small-latest'],
    free: true,
    local: false,
    description: 'European AI lab. Strong coding and reasoning models. Free tier available.',
    website: 'https://console.mistral.ai',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'mistral-small-latest', name: 'Mistral Small', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'codestral-latest', name: 'Codestral', contextK: 256, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    defaultModel: 'llama-3.3-70b',
    freeModels: ['llama-4-scout-17b-16e-instruct', 'llama-3.3-70b', 'llama3.1-8b', 'qwen-3-32b'],
    free: true,
    local: false,
    description: 'Fastest inference via CS-3 wafer-scale engine. Free tier with generous limits.',
    website: 'https://cloud.cerebras.ai',
    models: [
      { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'qwen-3-32b', name: 'Qwen 3 32B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
    freeModels: ['deepseek-chat'],
    free: true,
    local: false,
    description: 'Top-tier open models. DeepSeek V3 for chat, R1 for reasoning. Very affordable.',
    website: 'https://platform.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', contextK: 64, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextK: 64, free: true, supportsTools: false, supportsVision: false },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', contextK: 16, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    baseURL: 'https://api.cohere.com/compatibility/v1',
    apiKeyEnv: 'COHERE_API_KEY',
    defaultModel: 'command-r-plus-08-2024',
    freeModels: ['command-r-08-2024'],
    free: true,
    local: false,
    description: 'Enterprise-focused AI. Command models with strong RAG and tool use.',
    website: 'https://dashboard.cohere.com',
    models: [
      { id: 'command-r-plus-08-2024', name: 'Command R+', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'command-r-08-2024', name: 'Command R', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'command-a-03-2025', name: 'Command A', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKeyEnv: 'NVIDIA_API_KEY',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    freeModels: ['meta/llama-3.3-70b-instruct'],
    free: true,
    local: false,
    description: 'NVIDIA\'s inference platform. Access to Llama, Nemotron, and more. Free credits available.',
    website: 'https://build.nvidia.com',
    models: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Nemotron Ultra 253B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'githubmodels',
    name: 'GitHub Models',
    baseURL: 'https://models.github.ai/inference',
    apiKeyEnv: 'GITHUB_TOKEN',
    defaultModel: 'gpt-4o',
    freeModels: ['gpt-4o-mini', 'Meta-Llama-3.3-70B-Instruct', 'Phi-4'],
    free: true,
    local: false,
    description: 'Free AI models via GitHub. Use your existing GitHub token. GPT-4o, Llama, Phi, DeepSeek.',
    website: 'https://github.com/marketplace/models',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'o3', name: 'o3', contextK: 200, free: false, supportsTools: true, supportsVision: false },
      { id: 'o4-mini', name: 'o4-mini', contextK: 200, free: false, supportsTools: true, supportsVision: false },
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'DeepSeek-R1', name: 'DeepSeek R1', contextK: 64, free: true, supportsTools: false, supportsVision: false },
      { id: 'Phi-4', name: 'Phi-4', contextK: 16, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Inference',
    baseURL: 'https://router.huggingface.co/v1',
    apiKeyEnv: 'HF_TOKEN',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
    freeModels: ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3-0324', 'google/gemma-3-27b-it'],
    free: true,
    local: false,
    description: 'Access to 1000s of open models. Free tier with HF token. Llama, Qwen, DeepSeek, Gemma.',
    website: 'https://huggingface.co',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', contextK: 64, free: true, supportsTools: true, supportsVision: false },
      { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    freeModels: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'meta-llama/Meta-Llama-3.3-70B-Instruct', 'Qwen/Qwen2.5-Coder-32B-Instruct'],
    free: true,
    local: false,
    description: 'Fast inference for open-source models. Free tier with generous limits. Qwen, DeepSeek, Llama.',
    website: 'https://siliconflow.cn',
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextK: 64, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', contextK: 64, free: true, supportsTools: false, supportsVision: false },
      { id: 'meta-llama/Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'chutes',
    name: 'Chutes AI',
    baseURL: 'https://llm.chutes.ai/v1',
    apiKeyEnv: 'CHUTES_API_KEY',
    defaultModel: 'deepseek-ai/DeepSeek-V3-0324',
    freeModels: ['deepseek-ai/DeepSeek-V3-0324', 'Qwen/Qwen2.5-72B-Instruct'],
    free: true,
    local: false,
    description: 'Free inference for open-source models. No credit card required.',
    website: 'https://chutes.ai',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', contextK: 64, free: true, supportsTools: true, supportsVision: false },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'glhf',
    name: 'GLHF',
    baseURL: 'https://glhf.chat/api/v1',
    apiKeyEnv: 'GLHF_API_KEY',
    defaultModel: 'hf:meta-llama/Llama-3.3-70B-Instruct',
    freeModels: ['hf:meta-llama/Llama-3.3-70B-Instruct'],
    free: true,
    local: false,
    description: 'Free LLM gateway. Simple API, no credit card needed.',
    website: 'https://glhf.chat',
    models: [
      { id: 'hf:meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  PAID CLOUD — Requires payment method
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    freeModels: [],
    free: false,
    local: false,
    description: 'Industry-leading models. GPT-4o, o3, o4-mini. Best overall quality.',
    website: 'https://platform.openai.com',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextK: 128, free: false, supportsTools: true, supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextK: 128, free: false, supportsTools: true, supportsVision: true },
      { id: 'gpt-4.1', name: 'GPT-4.1', contextK: 1048, free: false, supportsTools: true, supportsVision: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', contextK: 1048, free: false, supportsTools: true, supportsVision: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', contextK: 1048, free: false, supportsTools: true, supportsVision: true },
      { id: 'o3', name: 'o3', contextK: 200, free: false, supportsTools: true, supportsVision: false },
      { id: 'o4-mini', name: 'o4-mini', contextK: 200, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    baseURL: 'https://api.x.ai/v1',
    apiKeyEnv: 'XAI_API_KEY',
    defaultModel: 'grok-3',
    freeModels: [],
    free: false,
    local: false,
    description: 'xAI\'s Grok models. Strong reasoning and coding capabilities.',
    website: 'https://console.x.ai',
    models: [
      { id: 'grok-3', name: 'Grok 3', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'grok-3-mini', name: 'Grok 3 Mini', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    freeModels: ['meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1', 'google/gemini-2.5-flash'],
    free: false,
    local: false,
    description: 'Universal AI gateway. Access any model from any provider. Some models are free.',
    website: 'https://openrouter.ai',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (free)', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (free)', contextK: 64, free: true, supportsTools: false, supportsVision: false },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (free)', contextK: 1048, free: true, supportsTools: true, supportsVision: false },
      { id: 'x-ai/grok-3', name: 'Grok 3', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B (free)', contextK: 128, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    baseURL: 'https://api.perplexity.ai',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    defaultModel: 'sonar-pro',
    freeModels: [],
    free: false,
    local: false,
    description: 'AI-powered search. Sonar models with online search capabilities.',
    website: 'https://docs.perplexity.ai',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', contextK: 200, free: false, supportsTools: true, supportsVision: false },
      { id: 'sonar', name: 'Sonar', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', contextK: 128, free: false, supportsTools: false, supportsVision: false },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    apiKeyEnv: 'TOGETHER_API_KEY',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    freeModels: [],
    free: false,
    local: false,
    description: 'Serverless inference for open-source models. Fast, reliable, affordable.',
    website: 'https://together.ai',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextK: 64, free: false, supportsTools: true, supportsVision: false },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    baseURL: 'https://api.fireworks.ai/inference/v1',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    freeModels: [],
    free: false,
    local: false,
    description: 'Fast inference for open-source models. Sub-second latency.',
    website: 'https://fireworks.ai',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'accounts/fireworks/models/deepseek-v3', name: 'DeepSeek V3', contextK: 64, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    baseURL: 'https://api.sambanova.ai/v1',
    apiKeyEnv: 'SAMBANOVA_API_KEY',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    freeModels: [],
    free: false,
    local: false,
    description: 'Custom silicon AI inference. Llama, DeepSeek, Qwen at high speed.',
    website: 'https://sambanova.ai',
    models: [
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1 Distill 70B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
      { id: 'Qwen3-32B', name: 'Qwen 3 32B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    baseURL: 'https://api.replicate.com/v1',
    apiKeyEnv: 'REPLICATE_API_TOKEN',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    freeModels: [],
    free: false,
    local: false,
    description: 'Run any open-source model in the cloud. Pay-per-prediction.',
    website: 'https://replicate.com',
    models: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'novita',
    name: 'Novita AI',
    baseURL: 'https://api.novita.ai/v3/openai',
    apiKeyEnv: 'NOVITA_API_KEY',
    defaultModel: 'deepseek/deepseek-v3-0324',
    freeModels: [],
    free: false,
    local: false,
    description: 'Cost-effective GPU inference. DeepSeek, Llama, Qwen models.',
    website: 'https://novita.ai',
    models: [
      { id: 'deepseek/deepseek-v3-0324', name: 'DeepSeek V3', contextK: 64, free: false, supportsTools: true, supportsVision: false },
      { id: 'meta-llama/Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', contextK: 128, free: false, supportsTools: true, supportsVision: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  LOCAL / SELF-HOSTED — Always free, runs on your machine
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ollama',
    name: 'Ollama',
    baseURL: process.env.OLLAMA_HOST
      ? `${process.env.OLLAMA_HOST.replace(/\/$/, '')}/v1`
      : 'http://localhost:11434/v1',
    apiKeyEnv: null,
    defaultModel: 'llama3.3',
    freeModels: ['llama3.3', 'llama3.2', 'qwen2.5-coder', 'deepseek-r1', 'mistral', 'phi4', 'gemma3', 'codellama'],
    free: true,
    local: true,
    description: 'Run LLMs locally. 100+ models. One-command install. Completely private.',
    website: 'https://ollama.ai',
    models: [
      { id: 'llama3.3', name: 'Llama 3.3', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'llama3.2', name: 'Llama 3.2', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'deepseek-r1', name: 'DeepSeek R1', contextK: 64, free: true, supportsTools: false, supportsVision: false },
      { id: 'mistral', name: 'Mistral', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'phi4', name: 'Phi-4', contextK: 16, free: true, supportsTools: true, supportsVision: false },
      { id: 'gemma3', name: 'Gemma 3', contextK: 128, free: true, supportsTools: true, supportsVision: false },
      { id: 'codellama', name: 'Code Llama', contextK: 16, free: true, supportsTools: true, supportsVision: false },
    ],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    baseURL: process.env.LMSTUDIO_HOST
      ? `${process.env.LMSTUDIO_HOST.replace(/\/$/, '')}/v1`
      : 'http://localhost:1234/v1',
    apiKeyEnv: null,
    defaultModel: 'local-model',
    freeModels: [],
    free: true,
    local: true,
    description: 'Desktop app for running local models. Beautiful GUI, OpenAI-compatible API.',
    website: 'https://lmstudio.ai',
    models: [],
  },
  {
    id: 'jan',
    name: 'Jan.ai',
    baseURL: process.env.JAN_HOST
      ? `${process.env.JAN_HOST.replace(/\/$/, '')}/v1`
      : 'http://localhost:1337/v1',
    apiKeyEnv: null,
    defaultModel: 'local-model',
    freeModels: [],
    free: true,
    local: true,
    description: 'Open-source local AI assistant. Privacy-first, runs fully offline.',
    website: 'https://jan.ai',
    models: [],
  },
  {
    id: 'vllm',
    name: 'vLLM',
    baseURL: process.env.VLLM_HOST
      ? `${process.env.VLLM_HOST.replace(/\/$/, '')}/v1`
      : 'http://localhost:8000/v1',
    apiKeyEnv: null,
    defaultModel: 'served-model',
    freeModels: [],
    free: true,
    local: true,
    description: 'High-throughput local inference engine. Best for serving models at scale.',
    website: 'https://github.com/vllm-project/vllm',
    models: [],
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp Server',
    baseURL: process.env.LLAMACPP_HOST
      ? `${process.env.LLAMACPP_HOST.replace(/\/$/, '')}/v1`
      : 'http://localhost:8080/v1',
    apiKeyEnv: null,
    defaultModel: 'served-model',
    freeModels: [],
    free: true,
    local: true,
    description: 'Lightweight C++ inference server. GGUF format. OpenAI-compatible API.',
    website: 'https://github.com/ggerganov/llama.cpp',
    models: [],
  },
  {
    id: 'custom',
    name: 'Custom endpoint',
    baseURL: process.env.AIX_BASE_URL || 'http://localhost:8080/v1',
    apiKeyEnv: 'AIX_API_KEY',
    defaultModel: process.env.AIX_MODEL || 'custom-model',
    freeModels: [],
    free: false,
    local: false,
    description: 'Connect to any OpenAI-compatible API endpoint. Set AIX_BASE_URL and AIX_MODEL.',
    models: [],
  },
]

export function getProvider(id: string): Provider | undefined {
  return providers.find(p => p.id === id)
}

const envProviderMap: [string, string][] = [
  ['AIX_PROVIDER', ''],
  ['AIX_USE_POLLINATIONS', 'pollinations'],
  ['AIX_USE_LLM7', 'llm7'],
  ['AIX_USE_GEMINI', 'gemini'],
  ['AIX_USE_GROQ', 'groq'],
  ['AIX_USE_MISTRAL', 'mistral'],
  ['AIX_USE_CEREBRAS', 'cerebras'],
  ['AIX_USE_DEEPSEEK', 'deepseek'],
  ['AIX_USE_COHERE', 'cohere'],
  ['AIX_USE_NVIDIA', 'nvidia'],
  ['AIX_USE_GITHUBMODELS', 'githubmodels'],
  ['AIX_USE_HUGGINGFACE', 'huggingface'],
  ['AIX_USE_SILICONFLOW', 'siliconflow'],
  ['AIX_USE_CHUTES', 'chutes'],
  ['AIX_USE_GLHF', 'glhf'],
  ['AIX_USE_OPENAI', 'openai'],
  ['AIX_USE_XAI', 'xai'],
  ['AIX_USE_OPENROUTER', 'openrouter'],
  ['AIX_USE_PERPLEXITY', 'perplexity'],
  ['AIX_USE_TOGETHER', 'together'],
  ['AIX_USE_FIREWORKS', 'fireworks'],
  ['AIX_USE_SAMBANOVA', 'sambanova'],
  ['AIX_USE_REPLICATE', 'replicate'],
  ['AIX_USE_NOVITA', 'novita'],
  ['AIX_USE_OLLAMA', 'ollama'],
  ['AIX_USE_LMSTUDIO', 'lmstudio'],
  ['AIX_USE_JAN', 'jan'],
  ['AIX_USE_VLLM', 'vllm'],
  ['AIX_USE_LLAMACPP', 'llamacpp'],
  ['AIX_USE_CUSTOM', 'custom'],
]

const apiKeyAutoDetect: [string, string][] = [
  ['GEMINI_API_KEY', 'gemini'],
  ['GROQ_API_KEY', 'groq'],
  ['DEEPSEEK_API_KEY', 'deepseek'],
  ['MISTRAL_API_KEY', 'mistral'],
  ['OPENAI_API_KEY', 'openai'],
  ['CEREBRAS_API_KEY', 'cerebras'],
  ['GITHUB_TOKEN', 'githubmodels'],
  ['HF_TOKEN', 'huggingface'],
  ['SILICONFLOW_API_KEY', 'siliconflow'],
  ['OPENROUTER_API_KEY', 'openrouter'],
  ['XAI_API_KEY', 'xai'],
]

export function detectProvider(): Provider {
  // Check explicit env vars first
  for (const [envVar, providerId] of envProviderMap) {
    const val = process.env[envVar]
    if (val) {
      if (envVar === 'AIX_PROVIDER') {
        const p = getProvider(val)
        if (p) return p
      } else {
        const p = getProvider(providerId)
        if (p) return p
      }
    }
  }
  // Auto-detect by API key presence
  for (const [envVar, providerId] of apiKeyAutoDetect) {
    if (process.env[envVar]) {
      const p = getProvider(providerId)
      if (p) return p
    }
  }
  // Default to pollinations
  return getProvider('pollinations')!
}

export function getApiKey(provider: Provider): string {
  if (!provider.apiKeyEnv) return 'no-key-required'
  return process.env[provider.apiKeyEnv] || ''
}

export function resolveModel(provider: Provider): string {
  return process.env.AIX_MODEL || provider.defaultModel
}

export const FREE_PROVIDER_IDS = providers.filter(p => p.free).map(p => p.id)
export const LOCAL_PROVIDER_IDS = providers.filter(p => p.local).map(p => p.id)

export { providers }
