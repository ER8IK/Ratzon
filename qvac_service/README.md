# Ratzon QVAC Service

QVAC is the local AI service for Ratzon. It does not sign transactions and does
not talk to Solana protocols directly. Its job is to turn user language into
structured intents before the Python bot routes those intents to protocol
adapters such as Jupiter.

## What It Does

- `POST /parse`: LLM intent parsing for ambiguous text.
- `POST /transcribe`: Whisper speech-to-text for Telegram or web voice input.
- `GET /health`: readiness check for the bot and deployment healthchecks.

Current flow:

```text
User text or voice
  -> Regex parser
  -> QVAC LLM fallback or QVAC Whisper
  -> Python intent dispatcher
  -> Protocol router
  -> Jupiter today, other protocol adapters later
```

If QVAC is unavailable, typed text still works through the regex parser. Voice
input returns a friendly unavailable message because transcription needs QVAC.

## Run Locally

```bash
cd qvac_service
corepack pnpm install
corepack pnpm start
```

The service listens on `http://localhost:3000` by default. First startup can take
longer because QVAC downloads and caches the LLM and Whisper models.

Set the bot environment to point at the service:

```bash
QVAC_URL=http://localhost:3000
```

When running with Docker Compose, the bot uses the internal service URL:

```bash
QVAC_URL=http://qvac:3000
```

## Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ratzon-qvac",
  "models": {
    "llm": "loaded",
    "stt": "loaded"
  }
}
```

## Parse Example

```bash
curl -X POST http://localhost:3000/parse \
  -H "Content-Type: application/json" \
  -d '{"message":"swap fifty usdc to sol"}'
```

Expected shape:

```json
{
  "intent": "swap",
  "amount": 50,
  "input_token": "USDC",
  "output_token": "SOL",
  "token": null,
  "token_a": null,
  "token_b": null,
  "confidence": 0.9
}
```

## Transcribe Example

`/transcribe` expects raw audio bytes:

```bash
curl -X POST http://localhost:3000/transcribe \
  -H "Content-Type: application/octet-stream" \
  --data-binary @sample.wav
```

Expected shape:

```json
{
  "text": "swap one sol to usdc"
}
```

## Operational Notes

- Runtime: Node.js `>=22.17`.
- Package manager: pnpm is preferred because `pnpm-lock.yaml` is committed.
- Model cache: Docker Compose mounts `qvac_models` to `/root/.qvac`.
- The LLM parser is intentionally low-temperature and JSON-only.
- QVAC should stay behind the bot/frontend service; it is an internal API.
