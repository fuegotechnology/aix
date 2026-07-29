<p align="center">
  <strong>◆ aix</strong> — AI coding assistant for your terminal
</p>

<p align="center">
  Works with <strong>47 AI providers</strong> — <strong>20 completely free</strong> with no API key, no signup, no credit card.
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

- **47 providers** — 20 no-key, 14 free tier, 8 paid, 5 local
- **9 built-in tools** — Read, write, edit, bash, search, tree, diagnose, glob, list
- **10 vibe modes** — Hacker, Pirate, Wizard, Zen, Fire, Gamer, Noir, Creative, Bro
- **Gamification** — XP, levels, achievements, streaks, stats tracking
- **Streaming** — Real-time streaming with tool call visualization
- **Multi-turn** — Full conversation history with auto context management
- **Auto tool use** — AI decides when to use tools
- **Project awareness** — Auto-detects language, framework, test setup
- **Zero dependencies** — Only Node.js builtins + glob
- **Privacy** — Local models for complete privacy

---

## 🚀 Quick Start

### Zero Setup (20 Free, No Key Providers!)

```bash
# Pollinations — works immediately
aix "explain this codebase"

# LLM7 — also works with no key
aix -p llm7 "write a hello world in rust"

# G4F — free GPT-4o access
aix -p g4f "optimize this function"

# DarkAI — free, no limits
aix -p darkai "fix the bug"
```

### With Vibes! 🎭

```bash
aix --vibe hacker "hack the mainframe"
aix --vibe pirate "find the treasure in this code"
aix --vibe wizard "cast a spell on this bug"
aix --vibe fire "LET'S GOOOO"
aix --vibe gamer "boss fight: fix this test"
```

### Free API Key (No Credit Card)

```bash
export GEMINI_API_KEY=your-key
aix "explain this code"
```

---

## 🎭 Vibe Modes

| Vibe | Emoji | Description |
|------|-------|-------------|
| `default` | 🎯 | Professional — clean, focused coding |
| `hacker` | 🤘 | Green-on-black, l33t speak, matrix vibes |
| `pirate` | 🏴‍☠️ | Arrr, matey! Code like a swashbuckler! |
| `wizard` | 🧙 | Mystical coding wisdom and ancient scrolls |
| `zen` | 🧘 | Calm, minimal, peaceful |
| `fire` | 🔥 | Hyped, energetic, maximum enthusiasm! |
| `gamer` | 🎮 | XP, quests, boss fights, gaming terms |
| `noir` | 🕵️ | Dark, gritty detective vibes |
| `creative` | 🎨 | Colorful, enthusiastic, full of ideas |
| `bro` | 😎 | Casual, chill, bro energy |

Switch vibes anytime with `/vibe <id>` in interactive mode.

---

## 🏆 Gamification

aix tracks your progress with XP, levels, and achievements!

### Levels

| Level | Name | XP Required | Emoji |
|-------|------|-------------|-------|
| 1 | Initiate | 0 | 🌱 |
| 2 | Apprentice | 50 | 📖 |
| 3 | Coder | 150 | 💻 |
| 4 | Hacker | 350 | ⚡ |
| 5 | Architect | 700 | 🏗️ |
| 6 | Expert | 1,200 | 🏆 |
| 7 | Master | 2,000 | 👑 |
| 8 | Grandmaster | 3,500 | 💎 |
| 9 | Transcendent | 5,500 | 🌟 |
| 10 | aix Ascended | 10,000 | 🔮 |

### XP System

| Action | XP |
|--------|-----|
| Send a message | +5 XP |
| Use a tool | +3 XP |
| Edit a file | +5 XP |
| Run a bash command | +2 XP |

### Achievements (33 total)

- **First Contact** 👋 — Send your first message
- **Tool Master** ⚙️ — Use 50 tools
- **Code Sculptor** 🎨 — Edit 50 files
- **Shell Wizard** 🧙 — Run 50 bash commands
- **Week Warrior** ⚔️ — 7-day streak
- **Unstoppable** 🌟 — 100-day streak
- **Provider Connoisseur** 🎯 — Use 10 different providers
- **Vibe Chameleon** 🦎 — Try every vibe
- **Free Spirit** 🆓 — Use only free providers for 50 messages
- **Million Token Club** 🎰 — Process 1M+ tokens
- **Night Owl** 🦉 — Use aix after midnight (secret!)
- ...and 22 more!

### Stats Commands

```bash
aix --stats          # Show your stats and achievements
/achievements        # In interactive mode
/stats               # In interactive mode
```

---

## 📦 Install

```bash
npm install -g aix
```

Requires Node.js 18+.

---

## 🆓 Free Providers

### No API Key Needed (20 providers!)

| ID | Name | Top Models |
|----|------|------------|
| `pollinations` | Pollinations AI | GPT-4o, DeepSeek, Gemini, Qwen |
| `llm7` | LLM7.io | GPT-4o, Gemini 2.5 Flash |
| `g4f` | G4F Proxy | GPT-4o, GPT-4o Mini |
| `freechat` | FreeChat | GPT-4o Mini, Llama 3.3 70B |
| `shard` | Shard AI | GPT-4o Mini, DeepSeek |
| `aichat` | AIChat | GPT-4o Mini, DeepSeek, Llama |
| `openaiProxy` | OpenAI Proxy | GPT-4o Mini |
| `chatany` | ChatAny | GPT-4o Mini, DeepSeek |
| `freegpt` | FreeGPT | GPT-4o Mini, Llama, DeepSeek |
| `aiproxy` | AI Proxy | GPT-4o Mini |
| `darkai` | DarkAI | GPT-4o, DeepSeek |
| `nexra` | Nexra | GPT-4o Mini |
| `chatgptfree` | ChatGPT Free | GPT-4o Mini |
| `yuai` | YuAI | GPT-4o Mini, DeepSeek, Llama |
| `zeroone` | 01.ai | Yi Large, Yi Medium |
| `zephyr` | Zephyr AI | Zephyr 7B |
| `dolphin` | Dolphin AI | Dolphin Mixtral, Dolphin Llama |
| `topmost` | TopMost AI | GPT-4o Mini, DeepSeek |
| `infinity` | Infinity AI | GPT-4o Mini, Llama |
| `skyline` | Skyline AI | GPT-4o Mini, DeepSeek, Qwen |

### Free API Key (No Credit Card)

| ID | Name | Key Env | Top Models |
|----|------|---------|------------|
| `gemini` | Google Gemini | GEMINI_API_KEY | gemini-2.5-pro (1M ctx) |
| `groq` | Groq | GROQ_API_KEY | llama-3.3-70b, mixtral |
| `cerebras` | Cerebras | CEREBRAS_API_KEY | llama-4-scout, qwen-3-32b |
| `deepseek` | DeepSeek | DEEPSEEK_API_KEY | deepseek-chat (V3) |
| `mistral` | Mistral AI | MISTRAL_API_KEY | mistral-small, codestral |
| `cohere` | Cohere | COHERE_API_KEY | command-r |
| `nvidia` | NVIDIA NIM | NVIDIA_API_KEY | llama-3.3-70b, nemotron |
| `githubmodels` | GitHub Models | GITHUB_TOKEN | gpt-4o-mini, phi-4 |
| `huggingface` | HuggingFace | HF_TOKEN | llama-3.3-70b, qwen-2.5-72b |
| `siliconflow` | SiliconFlow | SILICONFLOW_API_KEY | qwen-2.5-72b, deepseek-v3 |
| `chutes` | Chutes AI | CHUTES_API_KEY | deepseek-v3, qwen-2.5-72b |
| `glhf` | GLHF | GLHF_API_KEY | llama-3.3-70b |
| `together` | Together AI | TOGETHER_API_KEY | llama-3.3-70b (free $5 credit) |
| `fireworks` | Fireworks AI | FIREWORKS_API_KEY | llama-3.3-70b (free credits) |

---

## 🛠 Usage

### Interactive Mode

```bash
aix                          # Start interactive
aix -p gemini                # With Gemini
aix --vibe hacker            # Hacker mode!
aix -p pollinations --vibe pirate  # Free + pirate vibes!
```

### One-Shot Mode

```bash
aix "explain this codebase"
aix -p llm7 "write a fibonacci in go"
aix --vibe wizard -e "cast a spell on this bug"
```

### All Options

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `--providers` | List all providers |
| `-p, --provider <id>` | Use a specific provider |
| `-m, --model <name>` | Set model name |
| `--vibe <id>` | Set vibe mode |
| `--no-tools` | Disable tool use |
| `-e, --exec <prompt>` | One-shot mode |
| `--max-turns <n>` | Max agent turns (default: 20) |
| `--temperature <n>` | Set temperature (0.0 - 2.0) |
| `--verbose` | Show detailed tool output |
| `--quiet` | Minimal output |
| `--stats` | Show your stats and achievements |
| `--reset-stats` | Reset all stats |

### Interactive Commands

| Command | Description |
|---------|-------------|
| `/exit`, `/quit` | Exit aix |
| `/clear` | Clear conversation history |
| `/help` | Show help |
| `/providers` | List providers |
| `/model <name>` | Switch model |
| `/provider <id>` | Switch provider |
| `/vibe <id>` | Switch vibe mode |
| `/vibes` | List all vibes |
| `/stats` | Show your stats |
| `/achievements` | Show achievements |
| `/history` | Show message count |
| `/tools` | List available tools |
| `/retry` | Retry last message |
| `/compact` | Compact history |
| `/context` | Show project context |

---

## 🔧 Built-in Tools (9)

| Tool | Description |
|------|-------------|
| **read_file** | Read file contents with line numbers |
| **write_file** | Create or overwrite files |
| **edit_file** | Find and replace exact text |
| **bash** | Run shell commands |
| **list_files** | List files and directories |
| **search_files** | Search across files with regex |
| **glob_find** | Find files matching a pattern |
| **tree** | Display directory tree |
| **diagnose** | Run project diagnostics |

---

## 🌍 All Providers

### Paid

| ID | Name | Key Env |
|----|------|---------|
| `openai` | OpenAI | OPENAI_API_KEY |
| `xai` | xAI (Grok) | XAI_API_KEY |
| `openrouter` | OpenRouter | OPENROUTER_API_KEY |
| `perplexity` | Perplexity | PERPLEXITY_API_KEY |
| `sambanova` | SambaNova | SAMBANOVA_API_KEY |
| `replicate` | Replicate | REPLICATE_API_TOKEN |
| `novita` | Novita AI | NOVITA_API_KEY |

### Local / Self-Hosted

| ID | Name | Default Model |
|----|------|---------------|
| `ollama` | Ollama | llama3.3 |
| `lmstudio` | LM Studio | local-model |
| `jan` | Jan.ai | local-model |
| `vllm` | vLLM | served-model |
| `llamacpp` | llama.cpp Server | served-model |
| `custom` | Custom endpoint | custom-model |

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `AIX_PROVIDER` | Provider id to use |
| `AIX_MODEL` | Model name override |
| `AIX_VIBE` | Vibe mode (default, hacker, pirate, etc.) |
| `AIX_BASE_URL` | Custom endpoint base URL |
| `AIX_API_KEY` | Custom endpoint API key |
| `AIX_MAX_TURNS` | Max agent turns (default: 20) |
| `AIX_NO_TOOLS` | Set to "1" to disable tools |
| `AIX_USE_<PROVIDER>` | Quick-select provider |

---

## 🧠 Project Instructions

Create `AIX.md` in your project root:

```markdown
# AIX.md

- This project uses TypeScript with strict mode
- Always run `npm test` after making changes
- Follow the existing code style
```

Also supports `.aix/instructions.md` and `.cursorrules`.

---

## 📄 License

MIT
