<p align="center">
  <strong>◆ aix</strong> — AI coding assistant for your terminal
</p>

<p align="center">
  <strong>66 AI providers</strong> — <strong>39 completely free</strong> with no API key, no signup, no credit card.
</p>

<p align="center">
  <strong>31 vibe modes</strong> • <strong>72 achievements</strong> • <strong>15 levels</strong> • <strong>16 tools</strong>
</p>

<p align="center">
  <code>npm install -g aix</code>
</p>

---

## ✨ Features

- **66 providers** — 39 no-key, 14 free tier, 8 paid, 5 local
- **31 vibe modes** — Hacker, Pirate, Wizard, Anime, Vampire, Yoda, Disco, and more
- **72 achievements** — XP, combos, streaks, daily challenges, titles
- **15 levels** — Initiate → Apotheosis
- **16 built-in tools** — 9 coding + 6 action + 6 new (web_fetch, git_status, env_info, todo, diff_view, memory)
- **Combo system** — Chain messages for XP multipliers up to 2x
- **Daily challenges** — Fresh challenge every day with bonus XP
- **18 titles** — Unlock and equip titles like "Hacker", "Vibe Master", "God"
- **Session save/load** — Save and resume conversations
- **Smart fallback** — Auto-switch to another free provider if one fails
- **Pipe support** — Pipe input from stdin: `echo "hello" | aix`
- **Streaming** — Real-time streaming with tool call visualization
- **Multi-turn** — Full conversation history with auto context management
- **Zero dependencies** — Only Node.js builtins + glob

---

## 🚀 Quick Start

### Zero Setup (39 Free, No Key Providers!)

```bash
aix "explain this codebase"           # Pollinations — works immediately
aix -p llm7 "write hello world"       # LLM7 — also no key
aix -p darkai "fix the bug"           # DarkAI — no key
aix -p g4f "optimize this function"   # G4F — no key
```

### With Vibes! 🎭

```bash
aix --vibe hacker "hack the mainframe"
aix --vibe pirate "find the treasure in this code"
aix --vibe vampire "debug this ancient code"
aix --vibe yoda "code, I must"
aix --vibe disco "stayin alive in code"
aix --vibe kawaii "make this code adorable"
```

### Pipe Support

```bash
echo "explain this function" | aix
cat error.log | aix "what's wrong with this?"
```

---

## 🎭 31 Vibe Modes

| Vibe | Emoji | Description |
|------|-------|-------------|
| `default` | 🎯 | Professional — clean, focused |
| `hacker` | 🤘 | Green-on-black, l33t speak |
| `pirate` | 🏴‍☠️ | Arrr, matey! |
| `wizard` | 🧙 | Mystical coding wisdom |
| `zen` | 🧘 | Calm, minimal, peaceful |
| `fire` | 🔥 | Hyped, energetic! |
| `gamer` | 🎮 | XP, quests, boss fights |
| `noir` | 🕵️ | Dark, gritty detective |
| `creative` | 🎨 | Colorful, enthusiastic |
| `bro` | 😎 | Casual, chill energy |
| `robot` | 🤖 | Beep boop, precision |
| `shakespeare` | 🎭 | Forsooth! Iambic code! |
| `cowboy` | 🤠 | Yeehaw, saddle up! |
| `anime` | ⚡ | Nani?! Power up! |
| `chef` | 👨‍🍳 | Let's cook some code! |
| `scientist` | 🔬 | Empirical, precise |
| `medieval` | ⚔️ | Knight of the code |
| `surfer` | 🏄 | Catch the wave, dude! |
| `philosopher` | 🤔 | Deep thoughts |
| `rapper` | 🎤 | Drop bars, ship code! |
| `beach` | 🏖️ | Tropical vibes, code under the palms |
| `vampire` | 🧛 | Dark, ancient, eternally debugging |
| `alien` | 👽 | Take me to your codebase! |
| `yoda` | 🟢 | Code, you must. Wise, you will become. |
| `mobster` | 🤵 | An offer you can't refuse |
| `disco` | 🪩 | Stayin' alive in code! |
| `synthwave` | 🌆 | Neon lights, retro futures |
| `goth` | 🖤 | Dark, moody, beautiful code |
| `memelord` | 🐸 | Much code, very wow |
| `kawaii` | 🌸 | Super cute, pastel, adorable code! |
| `retro` | 👾 | 8-bit, pixel art, old school |

---

## 🛠 16 Built-in Tools

### Coding Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents with line numbers |
| `write_file` | Create or overwrite files |
| `edit_file` | Find and replace text in files |
| `bash` | Run shell commands |
| `list_files` | List files and directories |
| `search_files` | Search across files with regex |
| `glob_find` | Find files matching a pattern |
| `tree` | Display directory tree |
| `diagnose` | Run project diagnostics |
| `web_fetch` | Fetch content from a URL |
| `git_status` | Show git status and recent commits |
| `env_info` | Show environment information |
| `todo` | Manage a session todo list |
| `diff_view` | Show uncommitted changes |
| `memory` | Save/recall information across the conversation |

### Action Tools

| Tool | Description |
|------|-------------|
| `think` | Think through a problem step by step |
| `suggest` | Suggest next steps or improvements |
| `follow_up` | Suggest follow-up questions |
| `plan` | Create a plan before executing |
| `note` | Add important notes or warnings |
| `question` | Ask a clarifying question |

---

## 🏆 Gamification

### 15 Levels

| Level | Name | XP | Emoji |
|-------|------|----|-------|
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
| 11 | Mythic | 15,000 | ⚔️ |
| 12 | Celestial | 25,000 | ✨ |
| 13 | Eternal | 50,000 | 🌀 |
| 14 | Omega | 100,000 | 💠 |
| 15 | Apotheosis | 200,000 | 🌠 |

### XP System

| Action | Base XP |
|--------|---------|
| Send a message | +5 XP |
| Use a tool | +3 XP |
| Edit a file | +5 XP |
| Run a bash command | +2 XP |

### ⚡ Combo System

Chain messages within 2 minutes to build combos:

| Combo | Multiplier |
|-------|-----------|
| 3x+ | ×1.25 |
| 5x+ | ×1.5 |
| 10x+ | ×2.0 |

### 📅 Daily Challenges

Fresh challenge every day with bonus XP! Examples:
- Chat Starter — Send 5 messages (+30 XP)
- Tool Time — Use 5 tools (+40 XP)
- Combo Time — Hit a 5x combo (+50 XP)
- Vibe Hopper — Try 2 vibes (+30 XP)

### 18 Titles

Unlock and equip titles: `/title <id>`

| Title | Emoji | How to Unlock |
|-------|-------|---------------|
| Newbie | 🌱 | Default |
| Free Bird | 🆓 | Use 5+ free providers |
| Hacker | 🤘 | Run 50+ bash commands |
| Architect | 🏗️ | Edit 50+ files |
| Speedster | ⚡ | Hit 10x combo |
| Explorer | 🗺️ | Use 10+ providers |
| Vibe Master | 🎭 | Try 10+ vibes |
| Streaker | 🔥 | 30-day streak |
| Legend | 💎 | Reach level 10 |
| God | 🔱 | Reach level 15 |
| Night Coder | 🧛 | Complete 20+ sessions |
| Combo Queen | 👑 | Hit 25x combo |
| Vibe Chameleon | 🦎 | Try 15+ vibes |
| Provider Nomad | 🚀 | Use 30+ providers |
| Session Master | 🧘 | Complete 100+ sessions |
| XP Millionaire | 💰 | Earn 100,000+ XP |

### 72 Achievements

Categories: First Steps, Messages, Tools, Edits, Bash, Streaks, Providers, Vibes, Combos, Levels, Daily, Special, Secret

---

## 🆓 Free Providers

### No API Key Needed (39 providers!)

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
| `oivoodoo` | OiVoodoo AI | GPT-4o Mini, DeepSeek |
| `luckyai` | Lucky AI | GPT-4o Mini, DeepSeek |
| `aurora` | Aurora AI | GPT-4o Mini, Llama |
| `neonai` | NeonAI | GPT-4o Mini, DeepSeek, Qwen |
| `fluxai` | FluxAI | GPT-4o Mini |
| `helixai` | HelixAI | DeepSeek, GPT-4o Mini, Llama |
| `cortexai` | CortexAI | GPT-4o Mini, DeepSeek |
| `prismai` | PrismAI | GPT-4o Mini, DeepSeek |
| `quantumai` | QuantumAI | GPT-4o Mini, DeepSeek, Qwen |
| `eclipseai` | EclipseAI | GPT-4o Mini, Llama |
| `novaai` | NovaAI | GPT-4o Mini, DeepSeek, Llama |
| `zenithai` | ZenithAI | GPT-4o Mini, GPT-3.5, Qwen |
| `pulsarai` | PulsarAI | GPT-4o Mini, DeepSeek |
| `vertexai` | VertexAI | GPT-4o Mini, Llama, DeepSeek |
| `cipherai` | CipherAI | GPT-4o Mini, DeepSeek, Qwen |
| `nexusai` | NexusAI | GPT-4o Mini, Llama |
| `sparkai` | SparkAI | GPT-4o Mini, DeepSeek |
| `stellarai` | StellarAI | GPT-4o Mini, Llama, Qwen |
| `phantomai` | PhantomAI | GPT-4o Mini, DeepSeek, GPT-3.5 |

### Free API Key (No Credit Card)

| ID | Name | Key Env |
|----|------|---------|
| `gemini` | Google Gemini | GEMINI_API_KEY |
| `groq` | Groq | GROQ_API_KEY |
| `cerebras` | Cerebras | CEREBRAS_API_KEY |
| `deepseek` | DeepSeek | DEEPSEEK_API_KEY |
| `mistral` | Mistral AI | MISTRAL_API_KEY |
| `cohere` | Cohere | COHERE_API_KEY |
| `nvidia` | NVIDIA NIM | NVIDIA_API_KEY |
| `githubmodels` | GitHub Models | GITHUB_TOKEN |
| `huggingface` | HuggingFace | HF_TOKEN |
| `siliconflow` | SiliconFlow | SILICONFLOW_API_KEY |
| `chutes` | Chutes AI | CHUTES_API_KEY |
| `glhf` | GLHF | GLHF_API_KEY |
| `together` | Together AI | TOGETHER_API_KEY |
| `fireworks` | Fireworks AI | FIREWORKS_API_KEY |

---

## 🛠 Usage

```bash
aix                                    # Interactive mode
aix -p pollinations "hello"           # Free, no key
aix --vibe hacker "explain this"      # Hacker mode!
aix -p llm7 --vibe vampire "debug"    # Free + vampire vibes!
echo "what is this?" | aix            # Pipe input
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
| `--max-turns <n>` | Max agent turns |
| `--temperature <n>` | Set temperature |
| `--verbose` | Show detailed tool output |
| `--stats` | Show stats and achievements |
| `--reset-stats` | Reset all stats |
| `--fallback` | Auto-fallback to another free provider on failure |

### Interactive Commands

| Command | Description |
|---------|-------------|
| `/exit`, `/quit` | Exit aix |
| `/clear` | Clear history |
| `/vibe <id>` | Switch vibe |
| `/vibes` | List all vibes |
| `/provider <id>` | Switch provider |
| `/model <name>` | Switch model |
| `/stats` | Show stats |
| `/achievements` | Show achievements |
| `/daily` | Show daily challenge |
| `/title [id]` | Set/view titles |
| `/tools` | List tools |
| `/retry` | Retry last message |
| `/compact` | Compact history |
| `/save` | Save current session |
| `/load` | Load a saved session |
| `/fallback` | Switch to another free provider |

---

## 📄 License

MIT
