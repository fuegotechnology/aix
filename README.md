<p align="center">
  <strong>◆ aix</strong> — AI coding assistant for your terminal
</p>

<p align="center">
  Works with <strong>30+ AI providers</strong> — many completely free, no credit card required.
</p>

<p align="center">
  <code>npm install -g aix</code>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/l/aix" alt="MIT License" />
  <img src="https://img.shields.io/node/v/aix" alt="Node.js >=18" />
</p>

---

## ✨ Features

- **30+ providers** — OpenAI, Gemini, Groq, DeepSeek, Mistral, Ollama, and many more
- **Completely free** — Pollinations and LLM7 work with zero setup, no API key
- **9 built-in tools** — Read, write, edit files, run bash, search, tree, diagnose
- **Streaming** — Real-time streaming responses with tool call visualization
- **Multi-turn** — Full conversation history with automatic context management
- **Auto tool use** — The AI decides when to use tools, you just ask
- **Project awareness** — Auto-detects your project type, framework, and test setup
- **Local models** — Works with Ollama, LM Studio, vLLM, llama.cpp, and more
- **Zero dependencies** — Only Node.js builtins + glob. No chalk, no axios, no bloat
- **Privacy** — Your code stays local. Use local models for complete privacy

---

## 🚀 Quick Start

### Zero Setup (Free, No API Key)

```bash
# Pollinations — works immediately, no key needed
aix "explain this codebase"

# LLM7 — also works with no key
aix -p llm7 "write a hello world in rust"
```

### Free API Key (No Credit Card)

```bash
# Google Gemini — free key from aistudio.google.com
export GEMINI_API_KEY=your-key
aix "optimize this function"

# Groq — ultra-fast, free key from groq.com
export GROQ_API_KEY=your-key
aix -p groq "fix the bug in main.ts"

# Use environment shortcuts
AIX_USE_GEMINI=1 aix "explain this code"
```

### Local Models

```bash
# Ollama — 100% private, runs on your machine
aix -p ollama "what is this project?"
```

---

## 📦 Install

```bash
npm install -g aix
```

Requires Node.js 18+.

---

## 🆓 Free Tier Providers

These providers offer free API keys with no credit card required:

| Provider | Key Env | Top Models | Get Key |
|----------|---------|------------|---------|
| **Pollinations** | None | GPT-4o, DeepSeek, Gemini | No key needed |
| **LLM7** | None | GPT-4o, Gemini 2.5 Flash | No key needed |
| **Google Gemini** | `GEMINI_API_KEY` | gemini-2.5-pro (1M ctx), gemini-2.5-flash | [aistudio.google.com](https://aistudio.google.com) |
| **Groq** | `GROQ_API_KEY` | llama-3.3-70b, mixtral-8x7b | [groq.com](https://console.groq.com) |
| **Cerebras** | `CEREBRAS_API_KEY` | llama-4-scout, llama-3.3-70b, qwen-3-32b | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **DeepSeek** | `DEEPSEEK_API_KEY` | deepseek-chat (V3), deepseek-reasoner (R1) | [platform.deepseek.com](https://platform.deepseek.com) |
| **Mistral** | `MISTRAL_API_KEY` | mistral-small-latest, codestral | [console.mistral.ai](https://console.mistral.ai) |
| **Cohere** | `COHERE_API_KEY` | command-r, command-r-plus | [dashboard.cohere.com](https://dashboard.cohere.com) |
| **NVIDIA NIM** | `NVIDIA_API_KEY` | llama-3.3-70b, nemotron-ultra-253b | [build.nvidia.com](https://build.nvidia.com) |
| **GitHub Models** | `GITHUB_TOKEN` | gpt-4o-mini, phi-4, llama-3.3, deepseek-r1 | [github.com](https://github.com/marketplace/models) |
| **HuggingFace** | `HF_TOKEN` | llama-3.3-70b, qwen-2.5-72b, deepseek-v3 | [huggingface.co](https://huggingface.co) |
| **SiliconFlow** | `SILICONFLOW_API_KEY` | qwen-2.5-72b, deepseek-v3, deepseek-r1 | [siliconflow.cn](https://siliconflow.cn) |
| **Chutes** | `CHUTES_API_KEY` | deepseek-v3, qwen-2.5-72b | [chutes.ai](https://chutes.ai) |
| **GLHF** | `GLHF_API_KEY` | llama-3.3-70b | [glhf.chat](https://glhf.chat) |

---

## 🛠 Usage

### Interactive Mode

```bash
aix                          # Start interactive (auto-detects provider)
aix -p gemini                # Start with Gemini
aix -p groq -m llama-3.3-70b-versatile  # Specific provider + model
```

### One-Shot Mode

```bash
aix "explain this codebase"                    # Positional prompt
aix -e "fix the bug in main.ts"                # Explicit one-shot
aix -p pollinations "write a fibonacci in go"  # Free, no key
```

### All Options

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `--providers` | List all providers |
| `-p, --provider <id>` | Use a specific provider |
| `-m, --model <name>` | Set model name |
| `--no-tools` | Disable tool use (plain chat) |
| `-e, --exec <prompt>` | One-shot mode |
| `--max-turns <n>` | Max agent turns (default: 20) |
| `--temperature <n>` | Set temperature (0.0 - 2.0) |
| `--verbose` | Show detailed tool output |
| `--quiet` | Minimal output (errors only) |

### Interactive Commands

| Command | Description |
|---------|-------------|
| `/exit`, `/quit` | Exit aix |
| `/clear` | Clear conversation history |
| `/help` | Show help |
| `/providers` | List providers |
| `/model <name>` | Switch model |
| `/provider <id>` | Switch provider |
| `/history` | Show message count |
| `/context` | Show project context |
| `/tools` | List available tools |
| `/retry` | Retry last message |
| `/compact` | Compact conversation history |

---

## 🔧 Built-in Tools

aix has 9 built-in coding tools that the AI can use automatically:

| Tool | Description |
|------|-------------|
| **read_file** | Read file contents with line numbers. Supports line ranges. |
| **write_file** | Create or overwrite files. Creates parent directories. |
| **edit_file** | Find and replace exact text. Precise, targeted edits. |
| **bash** | Run shell commands. Tests, git, installs, anything. |
| **list_files** | List files and directories with glob patterns and sizes. |
| **search_files** | Search across files with regex. Find usages, patterns, imports. |
| **glob_find** | Find files matching a glob pattern. Quick file discovery. |
| **tree** | Display directory tree structure. Understand project layout. |
| **diagnose** | Run project diagnostics. Check deps, types, lint, tests. |

---

## 🔑 Environment Variables

### Core Configuration

| Variable | Description |
|----------|-------------|
| `AIX_PROVIDER` | Provider id to use |
| `AIX_MODEL` | Model name override |
| `AIX_BASE_URL` | Custom endpoint base URL |
| `AIX_API_KEY` | Custom endpoint API key |
| `AIX_MAX_TURNS` | Max agent turns (default: 20) |
| `AIX_NO_TOOLS` | Set to "1" to disable tools |
| `AIX_SYSTEM_PROMPT` | Custom system prompt file |

### Quick-Select Providers

Set any of these to `1` to quickly select a provider:

| Variable | Provider |
|----------|----------|
| `AIX_USE_POLLINATIONS` | Pollinations AI |
| `AIX_USE_LLM7` | LLM7.io |
| `AIX_USE_GEMINI` | Google Gemini |
| `AIX_USE_GROQ` | Groq |
| `AIX_USE_MISTRAL` | Mistral AI |
| `AIX_USE_CEREBRAS` | Cerebras |
| `AIX_USE_DEEPSEEK` | DeepSeek |
| `AIX_USE_COHERE` | Cohere |
| `AIX_USE_NVIDIA` | NVIDIA NIM |
| `AIX_USE_GITHUBMODELS` | GitHub Models |
| `AIX_USE_HUGGINGFACE` | HuggingFace |
| `AIX_USE_SILICONFLOW` | SiliconFlow |
| `AIX_USE_CHUTES` | Chutes AI |
| `AIX_USE_GLHF` | GLHF |
| `AIX_USE_OPENAI` | OpenAI |
| `AIX_USE_XAI` | xAI (Grok) |
| `AIX_USE_OPENROUTER` | OpenRouter |
| `AIX_USE_PERPLEXITY` | Perplexity |
| `AIX_USE_TOGETHER` | Together AI |
| `AIX_USE_FIREWORKS` | Fireworks AI |
| `AIX_USE_SAMBANOVA` | SambaNova |
| `AIX_USE_REPLICATE` | Replicate |
| `AIX_USE_NOVITA` | Novita AI |
| `AIX_USE_OLLAMA` | Ollama |
| `AIX_USE_LMSTUDIO` | LM Studio |
| `AIX_USE_JAN` | Jan.ai |
| `AIX_USE_VLLM` | vLLM |
| `AIX_USE_LLAMACPP` | llama.cpp Server |
| `AIX_USE_CUSTOM` | Custom endpoint |

### API Keys

| Variable | Provider |
|----------|----------|
| `GEMINI_API_KEY` | Google Gemini |
| `GROQ_API_KEY` | Groq |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `MISTRAL_API_KEY` | Mistral AI |
| `OPENAI_API_KEY` | OpenAI |
| `CEREBRAS_API_KEY` | Cerebras |
| `GITHUB_TOKEN` | GitHub Models |
| `HF_TOKEN` | HuggingFace |
| `SILICONFLOW_API_KEY` | SiliconFlow |
| `OPENROUTER_API_KEY` | OpenRouter |
| `XAI_API_KEY` | xAI (Grok) |
| `PERPLEXITY_API_KEY` | Perplexity |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `SAMBANOVA_API_KEY` | SambaNova |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `REPLICATE_API_TOKEN` | Replicate |
| `NOVITA_API_KEY` | Novita AI |

### Local Hosts

| Variable | Default | Provider |
|----------|---------|----------|
| `OLLAMA_HOST` | localhost:11434 | Ollama |
| `LMSTUDIO_HOST` | localhost:1234 | LM Studio |
| `JAN_HOST` | localhost:1337 | Jan.ai |
| `VLLM_HOST` | localhost:8000 | vLLM |
| `LLAMACPP_HOST` | localhost:8080 | llama.cpp |

---

## 🌍 All Providers

### Free — No API Key Needed

| ID | Name | Default Model | Description |
|----|------|---------------|-------------|
| `pollinations` | Pollinations AI | openai-large | Free AI gateway. Routes to GPT-4o, Mistral, DeepSeek, Gemini. |
| `llm7` | LLM7.io | gpt-4o | Free AI gateway. GPT-4o, Gemini, DeepSeek. |

### Free — Free API Key (No Credit Card)

| ID | Name | Key Env | Default Model | Description |
|----|------|---------|---------------|-------------|
| `gemini` | Google Gemini | GEMINI_API_KEY | gemini-2.5-pro | State-of-the-art with up to 2M context. |
| `groq` | Groq | GROQ_API_KEY | llama-3.3-70b-versatile | Ultra-fast inference. Best for speed. |
| `mistral` | Mistral AI | MISTRAL_API_KEY | mistral-large-latest | Strong coding and reasoning. |
| `cerebras` | Cerebras | CEREBRAS_API_KEY | llama-3.3-70b | Fastest inference via wafer-scale engine. |
| `deepseek` | DeepSeek | DEEPSEEK_API_KEY | deepseek-chat | Top-tier open models. Very affordable. |
| `cohere` | Cohere | COHERE_API_KEY | command-r-plus-08-2024 | Enterprise-focused with strong RAG. |
| `nvidia` | NVIDIA NIM | NVIDIA_API_KEY | meta/llama-3.3-70b-instruct | Llama, Nemotron, and more. |
| `githubmodels` | GitHub Models | GITHUB_TOKEN | gpt-4o | Free AI via GitHub. Use your token. |
| `huggingface` | HuggingFace | HF_TOKEN | meta-llama/Llama-3.3-70B-Instruct | 1000s of open models. |
| `siliconflow` | SiliconFlow | SILICONFLOW_API_KEY | Qwen/Qwen2.5-72B-Instruct | Fast inference for open-source models. |
| `chutes` | Chutes AI | CHUTES_API_KEY | deepseek-ai/DeepSeek-V3-0324 | Free inference for open-source models. |
| `glhf` | GLHF | GLHF_API_KEY | hf:meta-llama/Llama-3.3-70B-Instruct | Free LLM gateway. |

### Paid

| ID | Name | Key Env | Default Model |
|----|------|---------|---------------|
| `openai` | OpenAI | OPENAI_API_KEY | gpt-4o |
| `xai` | xAI (Grok) | XAI_API_KEY | grok-3 |
| `openrouter` | OpenRouter | OPENROUTER_API_KEY | meta-llama/llama-3.3-70b-instruct |
| `perplexity` | Perplexity | PERPLEXITY_API_KEY | sonar-pro |
| `together` | Together AI | TOGETHER_API_KEY | meta-llama/Llama-3.3-70B-Instruct-Turbo |
| `fireworks` | Fireworks AI | FIREWORKS_API_KEY | llama-v3p3-70b-instruct |
| `sambanova` | SambaNova | SAMBANOVA_API_KEY | Meta-Llama-3.3-70B-Instruct |
| `replicate` | Replicate | REPLICATE_API_TOKEN | meta/llama-3.3-70b-instruct |
| `novita` | Novita AI | NOVITA_API_KEY | deepseek/deepseek-v3-0324 |

### Local / Self-Hosted

| ID | Name | Default Model | Description |
|----|------|---------------|-------------|
| `ollama` | Ollama | llama3.3 | 100+ models. One-command install. |
| `lmstudio` | LM Studio | local-model | Beautiful GUI for local models. |
| `jan` | Jan.ai | local-model | Open-source, privacy-first. |
| `vllm` | vLLM | served-model | High-throughput inference engine. |
| `llamacpp` | llama.cpp Server | served-model | Lightweight C++ inference. |
| `custom` | Custom endpoint | custom-model | Any OpenAI-compatible API. |

---

## 🧠 Smart System Prompt

aix builds a comprehensive system prompt that includes:

- **Tool descriptions** — Detailed instructions for all 9 tools
- **Working style guidelines** — Read before editing, prefer edit_file, run tests
- **Safety guidelines** — Never delete files without asking, don't commit secrets
- **Project instructions** — Automatically loaded from `AIX.md`, `.aix/instructions.md`, or `.cursorrules`
- **Project context** — Auto-detects language, framework, test runner, and dependencies
- **Current date** — Always knows today's date

### Project Instructions

Create an `AIX.md` file in your project root to give aix project-specific instructions:

```markdown
# AIX.md

- This project uses TypeScript with strict mode
- Always run `npm test` after making changes
- Follow the existing code style
- Use Vitest for testing
- Never modify the database schema without asking
```

You can also use `.aix/instructions.md` or `.cursorrules` — aix checks for these files in order.

---

## 📖 What It Can Do

### File Operations
- **Read** — View any file with line numbers and line ranges
- **Write** — Create new files with automatic directory creation
- **Edit** — Find and replace text precisely, with multiple-match detection
- **Search** — Regex search across your entire codebase
- **Tree** — Visualize your project structure
- **Glob** — Find files by pattern

### Code Intelligence
- **Bash** — Run any shell command: tests, git, installs, builds
- **Diagnose** — Check for missing dependencies, TypeScript errors, lint issues
- **Multi-turn** — Maintain context across conversations
- **Auto tool use** — The AI decides when to read, edit, or run commands

### Safety
- **No destructive commands** — Blocks `rm -rf /` and similar
- **Edit validation** — Detects multiple matches, warns before ambiguous edits
- **Timeout protection** — All commands have configurable timeouts
- **History bounding** — Keeps conversation history at 40 messages max

---

## 🏗 Architecture

```
aix/
├── src/
│   ├── cli.ts          # CLI entry point, arg parsing, interactive/one-shot modes
│   ├── providers.ts    # 30+ provider definitions, detection, key resolution
│   ├── llm.ts          # Streaming OpenAI Chat Completions client
│   ├── tools.ts        # 9 built-in coding tools
│   ├── agent.ts        # Agent loop: model → tools → model
│   ├── ui.ts           # Terminal UI with ANSI colors, spinner, markdown
│   └── system-prompt.ts # Smart system prompt builder
├── scripts/
│   └── bundle.mjs      # esbuild bundler
├── package.json
├── tsconfig.json
└── README.md
```

- **Zero external deps** — Only Node.js builtins + `glob`
- **Streaming-first** — Real-time SSE streaming with tool call accumulation
- **OpenAI-compatible** — Works with any provider that supports the OpenAI API
- **Single binary** — esbuild bundles everything into one file

---

## 📄 License

MIT
