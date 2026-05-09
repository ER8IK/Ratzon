# Safety Layer Baseline

Captured before adding the Smart Payment / recovery layer.

## Existing protection

- `bot/risk/engine.py` runs independent rules and aggregates a `RiskReport`.
- `bot/risk/rules.py` already covered unknown tokens, high price impact, large trades, zero-output quotes, stablecoin swap notes, and meme-token warnings.
- `bot/protocols/router.py` already isolated quote execution behind a protocol router, with Jupiter live and planned adapters listed.
- `bot/handlers/intent_handler.py` already kept pending swap quote data in Telegram FSM until confirmation.
- `frontend/app/components/ResultCard.jsx` already showed route, score, risk warnings, wallet handoff state, and transaction result links.

## Gaps closed by the Smart Payment work

- Address-network detection for Ethereum/ERC20, TRON/TRC20, Solana, BTC, and invalid input.
- Dynamic provider minimum checks surfaced in risk warnings and route UI.
- Deposit-style payment details persisted in an active order store.
- Active order recovery through `View payment details` and `Refresh status`.
- Cross-chain provider abstraction with a SimpleSwap demo adapter alongside Jupiter.
