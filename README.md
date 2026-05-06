# Ratzon — Intent Execution Layer for Solana

> Say what you want. Ratzon finds the best route and executes it on Solana.

**Built for:** Colosseum Frontier Hackathon × Superteam Georgia × Tether QVAC Track

---

## Architecture

```
User (Telegram / Web)
        │
        ▼
┌───────────────────────────────────────┐
│           RATZON INTENT LAYER         │
│                                       │
│  ┌─────────────┐  ┌────────────────┐  │
│  │ Regex Parser│  │  QVAC LLM      │  │
│  │  (fast)     │→ │  (intelligent) │  │
│  └─────────────┘  └────────────────┘  │
│         │                │            │
│         └────────────────┘            │
│                  │                    │
│         ┌────────▼────────┐           │
│         │ Intent Dispatcher│           │
│         └────────┬────────┘           │
│                  │                    │
│    ┌─────────────┼──────────────┐     │
│    ▼             ▼              ▼     │
│ Jupiter API  Risk Engine  Formatter   │
└───────────────────────────────────────┘
        │
        ▼
  Response to user
```

## QVAC Integration

Ratzon integrates QVAC as its AI backbone:

| Component | QVAC Module | Purpose |
|-----------|-------------|---------|
| LLM Parser | `@qvac/sdk` (Llama 3.2 1B) | Understands complex/ambiguous intents |
| Speech-to-Text | `@qvac/sdk` (Whisper) | Voice input in Telegram & Web |

**Why QVAC?**
- Local-first: user messages never leave the server
- No API keys or cloud costs for AI
- Works offline — true sovereignty

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 22.17+
- npm 10.9+

### 1. Clone and setup

```bash
git clone https://github.com/yourusername/ratzon
cd ratzon
```

### 2. Start QVAC service

```bash
cd qvac_service
npm install
node server.js
# Runs on http://localhost:3000
# First run downloads AI models (~1GB)
```

### 3. Start Python bot

```bash
cp .env.example .env
# Add your BOT_TOKEN to .env

pip install -r requirements.txt
python main.py
# Bot + API server on port 8080
```

### 4. Start frontend (optional)

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Or: Docker Compose (все сервисы одной командой)

```bash
cp .env.example .env
# Add BOT_TOKEN

docker-compose up
```

---

## What it does

### Supported intents

| User says | Ratzon does |
|-----------|-------------|
| `Swap 1 SOL to USDC` | Live Jupiter quote + risk score |
| `Buy 1000 BONK` | Swap SOL → BONK |
| `I want to exchange my solana for stable` | LLM parses → Swap SOL → USDC |
| `Price of BONK` | Live price from Jupiter |
| `Compare SOL and JUP` | Side-by-side price comparison |
| `Rate SOL to USDC` | Current exchange rate |
| 🎤 Voice message | Whisper STT → intent → execution |

### What's real vs demo

| Feature | Status |
|---------|--------|
| Intent parsing (regex + LLM) | ✅ Real |
| Jupiter live quotes | ✅ Real |
| Risk engine | ✅ Real |
| QVAC LLM parser | ✅ Real |
| QVAC Whisper STT | ✅ Real |
| Transaction signing | 🎭 Demo |

---

## Project Structure

```
ratzon/
├── bot/                    # Python Telegram bot
│   ├── main.py             # Entry point (bot + API server)
│   ├── api_server.py       # HTTP API for frontend
│   ├── handlers/           # aiogram handlers
│   ├── intents/            # Parser (regex + QVAC LLM)
│   │   ├── parser.py       # Hybrid parser
│   │   └── llm_parser.py   # QVAC LLM client
│   ├── services/           # Business logic
│   ├── solana/             # Jupiter integration
│   └── risk/               # Risk engine
│
├── qvac_service/           # Node.js QVAC AI service
│   ├── server.js           # HTTP server
│   ├── intent_parser.js    # LLM intent parsing
│   └── stt.js              # Speech-to-text
│
├── frontend/               # Next.js web app
│   └── src/
│       ├── app/            # Pages + API routes
│       └── components/     # UI components
│
├── docker-compose.yml
└── README.md
```

---

## Try it

**Telegram:** @Ratzon_bot

**Web:** Coming soon

---

## Built with

- Python · aiogram · aiohttp
- Jupiter Aggregator V6 API
- QVAC SDK (Llama 3.2 1B + Whisper)
- Next.js · TailwindCSS
- Solana