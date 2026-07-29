# aix — AI coding assistant for your terminal

**aix** is an AI coding assistant CLI that runs in your terminal. It works with 30+ AI providers — many of which are completely free with no credit card required.

## Install

```bash
npm install -g aix
```

## Zero-Setup (No API Key Needed)

```bash
# Pollinations — works immediately, no setup
aix "explain this codebase"

# LLM7 — also works with no key
aix -p llm7 "write a hello world in rust"
```

## Free Tier Providers

These providers offer free API keys with no credit card required:

| Provider | Key Env | Free Models | Get Key |
|----------|---------|-------------|---------|
| Google Gemini | `GEMINI_API_KEY` | gemini-2.5-pro, gemini-2.5-flash | [aistudio.google.com](https://aistudio.google.com) |
| Groq | `GROQ_API_KEY` | llama-3.3-70b, mixtral-8x7b | [groq.com](https://console.groq.com) |
| Cerebras | `CEREBRAS_API_KEY` | llama-3.3-70b, qwen-3-32b | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat (V3) | [platform.deepseek.com](https://platform.deepseek.com) |
| Mistral | `MISTRAL_API_KEY` | mistral-small-latest | [console.mistral.ai](https://console.mistral.ai) |
| Cohere | `COHERE_API_KEY` | command-r | [dashboard.cohere.com](https://dashboard.cohere.com) |
| NVIDIA NIM | `NVIDIA_API_KEY` | llama-3.3-70b, nemotron-ultra | [build.nvidia.com](https://build.nvidia.com) |
| GitHub Models | `GITHUB_TOKEN` | gpt-4o-mini, phi-4, llama-3.3 | [github.com](https://github.com) |
| HuggingFace | `HF_TOKEN` | llama-3.3-70b, qwen-2.5-72b | [huggingface.co](https://huggingface.co) |
| SiliconFlow | `SILICONFLOW_API_KEY` | qwen-2.5-72b, deepseek-v3 | [siliconflow.cn](https://siliconflow.cn) |

## Usage

```bash
# Interactive mode (auto-detects provider)
aix

# One-shot question
aix "explain this codebase"

# Explicit one-shot
aix -e "fix the bug in main.ts"

# Use a specific provider
aix -p gemini "optimize this function"

# Use a specific model
aix -p groq -m llama-3.3-70b-versatile "what does this code do?"

# Disable tools (plain chat)
aix --no-tools "tell me a joke"

# List all providers
aix --providers
```

### Options

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `--providers` | List all providers |
| `-p, --provider <id>` | Use a specific provider |
| `-m, --model <name>` | Set model name |
| `--no-tools` | Disable tool use |
| `-e, --exec <prompt>` | One-shot mode |

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

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AIX_PROVIDER` | Provider id to use |
| `AIX_MODEL` | Model name override |
| `AIX_BASE_URL` | Custom endpoint base URL |
| `AIX_API_KEY` | Custom endpoint API key |
| `AIX_USE_<PROVIDER>` | Quick-select provider (e.g. `AIX_USE_GEMINI=1`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `CEREBRAS_API_KEY` | Cerebras API key |
| `GITHUB_TOKEN` | GitHub token (for GitHub Models) |
| `HF_TOKEN` | HuggingFace token |
| `SILICONFLOW_API_KEY` | SiliconFlow API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `XAI_API_KEY` | xAI API key |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `TOGETHER_API_KEY` | Together AI API key |
| `FIREWORKS_API_KEY` | Fireworks AI API key |
| `SAMBANOVA_API_KEY` | SambaNova API key |
| `COHERE_API_KEY` | Cohere API key |
| `NVIDIA_API_KEY` | NVIDIA API key |
| `OLLAMA_HOST` | Ollama host (default: localhost:11434) |
| `LMSTUDIO_HOST` | LM Studio host (default: localhost:1234) |
| `JAN_HOST` | Jan host (default: localhost:1337) |
| `VLLM_HOST` | vLLM host (default: localhost:8000) |

## All Providers

### Free — No API Key Needed

| ID | Name | Default Model |
|----|------|---------------|
| `pollinations` | Pollinations AI | openai-large |
| `llm7` | LLM7.io | gpt-4o |

### Free — Free API Key Required

| ID | Name | Key Env | Default Model |
|----|------|---------|---------------|
| `gemini` | Google Gemini | GEMINI_API_KEY | gemini-2.5-pro |
| `groq` | Groq | GROQ_API_KEY | llama-3.3-70b-versatile |
| `mistral` | Mistral AI | MISTRAL_API_KEY | mistral-large-latest |
| `cerebras` | Cerebras | CEREBRAS_API_KEY | llama-3.3-70b |
| `deepseek` | DeepSeek | DEEPSEEK_API_KEY | deepseek-chat |
| `cohere` | Cohere | COHERE_API_KEY | command-r-plus-08-2024 |
| `nvidia` | NVIDIA NIM | NVIDIA_API_KEY | meta/llama-3.3-70b-instruct |
| `githubmodels` | GitHub Models | GITHUB_TOKEN | gpt-4o |
| `huggingface` | HuggingFace | HF_TOKEN | meta-llama/Llama-3.3-70B-Instruct |
| `siliconflow` | SiliconFlow | SILICONFLOW_API_KEY | Qwen/Qwen2.5-72B-Instruct |

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

### Local / Self-Hosted

| ID | Name | Default Model |
|----|------|---------------|
| `ollama` | Ollama | llama3.3 |
| `lmstudio` | LM Studio | local-model |
| `jan` | Jan.ai | local-model |
| `vllm` | vLLM | served-model |
| `custom` | Custom endpoint | custom-model |

## What It Can Do

- **File editing** — Read, write, and edit files with precision
- **Bash commands** — Run shell commands and scripts
- **Code search** — Search across your codebase with regex
- **Multi-turn conversations** — Maintain context across messages
- **Auto tool use** — The AI decides when to use tools
- **Project instructions** — Create `AIX.md` for project-specific guidance

## Project Instructions

Create an `AIX.md` file in your project root to give aix project-specific instructions. It will be automatically loaded and included in the system prompt.

```markdown
# AIX.md

- This project uses TypeScript with strict mode
- Always run `npm test` after making changes
- Follow the existing code style
```

You can also use `CLAUDE.md` or `.aix/instructions.md` — aix will check for these files in order.

## License

MIT
