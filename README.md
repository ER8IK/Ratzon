# Ratzon

Ratzon is a QVAC-powered intent execution layer for crypto actions. A user writes what they want in plain language, and Ratzon turns it into a routed, risk-checked, wallet-controlled flow.

The first interface is Telegram plus a Next.js WebApp. The product direction is broader: wallets, dApps, and agents should be able to send intents into one execution layer instead of rebuilding routing, safety checks, and recovery flows themselves.

Built for Colosseum Frontier Hackathon, Superteam Georgia, and the Tether QVAC track.

## Demo

Telegram: `@Ratzon_bot`

WebApp: configure `WEB_APP_URL` to your deployed frontend URL, then open it from the Telegram `/start` button.

Try these prompts:

| Prompt | Expected result |
| --- | --- |
| `Swap 1 SOL to USDC` | Jupiter quote, route context, risk output, and wallet-controlled approval path |
| `Swap 50 USDT TRC20 to BTC` | Guarded Smart Swap route with minimum, network, and recoverable payment details |
| `Price of SOL` | Market price response |
| `Long SOL with 2x` | Drift route preview with risk framing |

## What Works Today

| Area | Status | Notes |
| --- | --- | --- |
| Telegram bot | Live | `/start`, `/help`, `/tour`, `/status`, and natural-language messages |
| Regex intent parser | Live | Fast path for common swaps, prices, rates, compare, and protocol intents |
| QVAC LLM parser | Integrated | Local service parses ambiguous requests when available |
| QVAC Whisper STT | Integrated | Web voice input posts audio to the transcription route |
| Jupiter quotes | Live | Solana swap quotes and route metadata |
| Risk engine | Live | Slippage, token, route, and execution warnings |
| Phantom wallet flow | Implemented | User-controlled signing path for supported Solana swaps |
| Address safety | Live | Detects BTC, ETH/ERC20, TRON/TRC20, Solana, and invalid addresses |
| Smart Swap orders | Guarded | Payment details are checked and recoverable in Active Payment |
| Kamino, Drift, Jito/Marinade | Guarded previews | Routed UX and risk framing before deeper live integrations |

## Product Flow

```text
User input
  -> Regex parser + QVAC parser
  -> Intent dispatcher
  -> Protocol router
  -> Adapter: Jupiter / SimpleSwap / Kamino / Drift / staking
  -> Risk and address safety checks
  -> User confirmation
  -> Wallet-controlled execution or guarded payment details
```

Ratzon never needs custody of user keys. It prepares the route and makes the risks visible; the user stays in control of approval and payment.

## QVAC Integration

`qvac_service/` runs the local AI layer:

- intent parsing through QVAC LLM tooling
- voice transcription through QVAC Whisper tooling
- fallback behavior when QVAC is unavailable, so the demo still works with regex/local routes

Verify QVAC locally:

```bash
cd qvac_service
corepack pnpm install
corepack pnpm start
```

Then set:

```bash
QVAC_URL=http://localhost:3000
```

More details are in [`qvac_service/README.md`](qvac_service/README.md).

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 22.17+
- Corepack enabled for `pnpm`
- Telegram bot token

### 1. Install backend dependencies

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

Create `.env`:

```bash
BOT_TOKEN=...
QVAC_URL=http://localhost:3000
WEB_APP_URL=https://your-public-frontend.example
START_FRONTEND_WITH_BOT=true
FRONTEND_HOST=0.0.0.0
FRONTEND_MODE=auto
```

### 3. Run QVAC

```bash
cd qvac_service
corepack pnpm install
corepack pnpm start
```

### 4. Run bot and API

```bash
. .venv/bin/activate
python -m bot.main
```

The bot API runs internally, and the frontend can be started by the bot when `START_FRONTEND_WITH_BOT=true`.

### 5. Run frontend manually

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

Frontend URL: `http://localhost:4000`

## Docker Compose

```bash
cp .env.example .env
# set BOT_TOKEN and WEB_APP_URL
docker-compose up
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BOT_TOKEN` | Yes | Telegram bot token |
| `QVAC_URL` | Recommended | URL for local QVAC service, usually `http://localhost:3000` |
| `WEB_APP_URL` | Recommended | Public HTTPS URL used by Telegram WebApp buttons |
| `START_FRONTEND_WITH_BOT` | Optional | Starts Next.js from the bot process when true |
| `FRONTEND_HOST` | Optional | Host for the bot-managed frontend process |
| `FRONTEND_PORT` | Optional | Frontend port; leave empty on Railway when sharing `PORT` |
| `FRONTEND_MODE` | Optional | `auto`, `dev`, or `start` |
| `BOT_API_PORT` | Optional | Internal API port for frontend requests |
| `BOT_API_URL` | Optional | Frontend override for bot API URL when services are separate |
| `SIMPLESWAP_API_KEY` | Optional | Enables live provider calls where configured |

## Deployment Notes

Telegram Mini Apps require a public HTTPS `WEB_APP_URL`. Telegram will show the WebApp button from `/start`; it will not automatically open a Mini App from a command.

Railway:

- keep `WEB_APP_URL` pointed at the public frontend URL
- set `FRONTEND_HOST=0.0.0.0`
- leave `FRONTEND_PORT` empty if Railway owns `PORT`
- use `BOT_API_URL` when frontend and bot are deployed as separate services

`nixpacks.toml` installs Python and frontend dependencies, builds Next.js, and starts the bot with `python -m bot.main`.

## Project Structure

```text
ratzon/
  bot/                  Telegram bot, API server, intent parsing, routing, risk
  frontend/             Next.js WebApp, API routes, UI components
  qvac_service/         Local QVAC LLM and Whisper service
  tests/                Parser, risk, Phantom, and smart-order tests
  docs/                 Runtime and validation notes
  pitch/                2:30 pitch template and deck source
  docker-compose.yml    Local multi-service runner
```

## Frontend Stack

- Next.js App Router
- TailwindCSS for layout and visual system
- MUI for polished chips, tooltips, and action surfaces
- GSAP for restrained motion with `prefers-reduced-motion` support
- lucide-react icons

## Validation

```bash
cd frontend
corepack pnpm build

cd ..
.venv/bin/python -m pytest
```

## Pitch

The investor/judge pitch template lives in [`pitch/README.md`](pitch/README.md). It is structured for a 2:30 demo:

1. Cover
2. Problem
3. Demo moment
4. How it works
5. Product vision
6. Wedge
7. Traction and ask

## Roadmap

- harden live signed execution across more wallets and mobile paths
- deepen Smart Swap provider integrations and status refresh
- expand guarded DeFi actions: staking, lending, yield, perps
- package the intent layer for wallets, dApps, and agent integrations
- onboard beta users from Telegram-native Solana traders

## Built With

Python, aiogram, aiohttp, Next.js, React, TailwindCSS, MUI, GSAP, Solana Web3.js, Jupiter Aggregator, QVAC, and Phantom.
