# Runtime Checklist

Use this checklist before a pitch or production smoke test.

## Required Services

| Service | Port | Required for | Health check |
|---------|------|--------------|--------------|
| QVAC service | `3000` | LLM intent fallback and voice transcription | `curl http://localhost:3000/health` |
| Bot API / Telegram bot | `8080` | intent dispatch, swaps, safety checks, orders | `curl http://localhost:8080/health` |
| Frontend | `4000` | WebApp execution surface | `curl http://localhost:4000` |

## Local Start

```bash
# 1. QVAC local AI
cd qvac_service
corepack pnpm install
QVAC_PORT=3000 corepack pnpm start
```

First install pulls large native QVAC/Whisper packages. If npm registry downloads
time out, rerun `corepack pnpm install`; pnpm will reuse the partial store.

```bash
# 2. Bot API + Telegram bot
cp .env.example .env
# Fill BOT_TOKEN and set QVAC_URL=http://localhost:3000
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m bot.main
```

```bash
# 3. Frontend, only if START_FRONTEND_WITH_BOT=false
cd frontend
corepack pnpm install
BOT_API_URL=http://localhost:8080 QVAC_URL=http://localhost:3000 corepack pnpm dev
```

## Smoke Checks

```bash
curl http://localhost:3000/health
curl http://localhost:8080/health
curl http://localhost:8080/capabilities
curl -X POST http://localhost:8080/intent \
  -H 'Content-Type: application/json' \
  -d '{"message":"swap 50 usdt trc20 to btc"}'
curl -X POST http://localhost:8080/safety/address \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e","expected_network":"BTC"}'
```

Expected pitch result: the route shows a provider minimum, the ERC20 address is rejected for a BTC route, a compatible BTC address can create a recoverable Active Payment order, and the frontend displays the QVAC integration notice.
