# Ratzon 2:30 Pitch Template

## Slide 1 - Cover (0:00-0:10)

**Headline:** Ratzon

**Subhead:** Protected crypto execution from plain language.

**Say:** "Ratzon is an intent execution layer for crypto. Instead of asking users to choose apps, routes, networks, and safety settings, they type what they want. Ratzon routes it, checks it, and keeps the user in control."

**Visual:** Logo, one-line promise, `@Ratzon_bot`.

## Slide 2 - Problem (0:10-0:30)

**Headline:** Crypto execution is still too manual.

**Say:** "DeFi has liquidity, but execution is still fragile. A normal user has to pick the right app, network, token, route, slippage, payout address, and wallet path. One wrong network or copied address can lose funds."

**Visual:** Before flow with too many steps: app, wallet, token, network, route, slippage, address, confirm.

## Slide 3 - Demo Moment (0:30-1:00)

**Headline:** One request becomes a guarded route.

**Say:** "The user says: 'Swap 50 USDT TRC20 to BTC.' Ratzon parses the intent, chooses the Smart Swap route, shows the minimum amount and expected network, then asks for a payout address. If the address is on the wrong network, it blocks the payment flow before funds move."

**Visual:** Chat bubble -> route card -> safety check -> active payment recovery.

## Slide 4 - How It Works (1:00-1:25)

**Headline:** QVAC parses. Router decides. Safety guards.

**Say:** "Under the hood, Ratzon combines regex parsing with QVAC for ambiguous intent and voice input. The dispatcher sends the intent to the protocol router. The adapter returns a quote or guarded route, then the risk layer and address safety layer make the next action explicit."

**Visual:** User input -> QVAC/regex parser -> dispatcher -> router -> adapter -> risk/safety -> user approval.

## Slide 5 - Product Vision (1:25-1:45)

**Headline:** Telegram is the first interface, not the product.

**Say:** "The first interface is a Telegram bot and WebApp because it is fast to distribute. But the product is the intent layer. Wallets, dApps, and agents should be able to ask Ratzon for safe execution instead of rebuilding routing and safety logic."

**Visual:** Telegram, wallets, dApps, AI agents -> Ratzon intent layer -> Jupiter, Smart Swap, Drift, Kamino, staking.

## Slide 6 - Wedge (1:45-2:10)

**Headline:** Start with painful, high-frequency routes.

**Say:** "The wedge is Telegram-native crypto users who already trade and move assets but do not want to open five apps to complete one action. We start with swaps and Smart Swap payments, then expand into staking, lending, perps, and agent-initiated execution."

**Visual:** Three lanes: first users, first actions, expansion.

## Slide 7 - Traction / Ask (2:10-2:30)

**Headline:** Working now. Ready for beta users.

**Say:** "Today we have the bot, QVAC intent parsing, voice input, Jupiter quotes, risk checks, address safety, active payment recovery, and a polished WebApp. The next milestone is hardening live signed execution and onboarding beta users. Try it at @Ratzon_bot."

**Visual:** Live checklist, next milestone, QR/link or bot handle.

## Backup Answers

**Why QVAC?** Local-first intent parsing and voice transcription reduce dependency on cloud LLM APIs and fit the user-sovereignty story.

**Is it custodial?** No. Ratzon prepares routes and payment details; user approval stays in the wallet or payment flow.

**Why Telegram first?** It is where crypto users already coordinate and gives the fastest path to distribution and feedback.

**What is defensible?** The protocol router, safety/recovery layer, and growing corpus of intent-to-action flows across Solana and cross-chain payments.
