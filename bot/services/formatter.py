# bot/services/formatter.py
"""
Форматирование ответов для Telegram.
Это ключевой UX-компонент — именно это видят судьи хакатона.

Использует HTML разметку aiogram.
"""

from bot.intents.models import (
    SwapIntent, SendIntent, BalanceIntent, PriceIntent,
    Intent, IntentType, QuoteResult, RiskReport, RiskLevel
)


def format_swap_response(
    intent: SwapIntent,
    quote: QuoteResult,
    risk: RiskReport,
) -> str:
    """
    Форматирует полный ответ на swap-запрос.
    
    Пример вывода:
    ━━━━━━━━━━━━━━━━━━━━
    🔄 Intent Recognized
    Swap 1 SOL → USDC
    ...
    """
    lines = []

    # ── Заголовок ──
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("🔄 <b>Intent Recognized</b>")
    lines.append(
        f"Swap <b>{intent.amount:g} {intent.input_token}</b> → "
        f"<b>{intent.output_token}</b>"
    )
    lines.append("")

    # ── Маршрут ──
    lines.append("📍 <b>Best Route</b>")
    lines.append(f"<code>{quote.route_label}</code>")
    lines.append("")

    # ── Результат ──
    lines.append("💰 <b>Estimated Output</b>")
    lines.append(
        f"<b>{quote.output_amount:,.4f} {intent.output_token}</b>"
    )
    lines.append(
        f"Rate: 1 {intent.input_token} = "
        f"{quote.exchange_rate:,.4f} {intent.output_token}"
    )
    lines.append("")

    # ── Price Impact ──
    impact_emoji = _impact_emoji(quote.price_impact_pct)
    lines.append("📊 <b>Price Impact</b>")
    lines.append(f"{impact_emoji} {quote.price_impact_display}")
    lines.append("")

    # ── Комиссии ──
    lines.append("⛽ <b>Network Fee</b>")
    lines.append("~0.000005 SOL (Solana tx fee)")
    lines.append("")

    # ── Риск ──
    lines.append("🛡 <b>Risk Assessment</b>")
    lines.append(f"Level: {risk.level.value}")
    lines.append(f"Score: {risk.score}/100")

    if risk.warnings:
        lines.append("")
        for w in risk.warnings:
            lines.append(f"  {w}")

    lines.append("")
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("Proceed with this swap?")

    return "\n".join(lines)

def format_price_real(symbol: str, price_data: dict) -> str:
    price = price_data.get("price_usd", 0)
    if price >= 1:
        price_str = f"${price:,.4f}"
    elif price >= 0.001:
        price_str = f"${price:.6f}"
    else:
        price_str = f"${price:.10f}"

    return (
        f"💲 <b>{symbol} Price</b>\n\n"
        f"<b>{price_str}</b>\n\n"
        f"<i>Live data · Jupiter Price API</i>\n\n"
        f"Want to swap? Try:\n"
        f"<code>Swap 1 {symbol} to USDC</code>"
    )


def format_price_unavailable(symbol: str) -> str:
    return (
        f"❓ <b>{symbol} price not found</b>\n\n"
        f"This token may not be listed on Jupiter.\n\n"
        f"Try: <code>Swap 1 {symbol} to USDC</code> to get a live quote."
    )


def format_rate(intent, quote: QuoteResult) -> str:
    return (
        f"📐 <b>Rate</b>\n\n"
        f"1 <b>{intent.input_token}</b> = "
        f"<b>{quote.exchange_rate:,.4f} {intent.output_token}</b>\n\n"
        f"Route: <code>{quote.route_label}</code>\n"
        f"Price impact: {_impact_emoji(quote.price_impact_pct)} {quote.price_impact_display}\n\n"
        f"<i>Live data · Jupiter Aggregator</i>"
    )


def format_compare(
    token_a: str, price_a: dict | None,
    token_b: str, price_b: dict | None,
) -> str:
    def fmt(symbol, data):
        if not data:
            return f"{symbol}: <i>unavailable</i>"
        p = data["price_usd"]
        if p >= 1:
            return f"{symbol}: <b>${p:,.4f}</b>"
        else:
            return f"{symbol}: <b>${p:.8f}</b>"

    lines = [
        "⚖️ <b>Price Comparison</b>\n",
        fmt(token_a, price_a),
        fmt(token_b, price_b),
    ]

    if price_a and price_b and price_b["price_usd"] > 0:
        ratio = price_a["price_usd"] / price_b["price_usd"]
        lines.append(f"\n1 {token_a} = <b>{ratio:,.4f} {token_b}</b>")

    lines.append("\n<i>Live data · Jupiter Price API</i>")
    return "\n".join(lines)


def format_intent_unknown(text: str) -> str:
    return (
        "🤔 <b>Intent not recognized</b>\n\n"
        f"I couldn't understand: <i>{text}</i>\n\n"
        "Try one of these:\n"
        "• <code>Swap 1 SOL to USDC</code>\n"
        "• <code>Send 0.5 SOL to ABC123</code>\n"
        "• <code>Price of BONK</code>\n"
        "• <code>My balance</code>"
    )


def format_parse_error(intent: SwapIntent) -> str:
    missing = []
    if intent.amount is None:
        missing.append("amount (e.g. <code>1</code>)")
    if intent.input_token is None:
        missing.append("input token (e.g. <code>SOL</code>)")
    if intent.output_token is None:
        missing.append("output token (e.g. <code>USDC</code>)")

    return (
        "⚠️ <b>Incomplete swap request</b>\n\n"
        f"Missing: {', '.join(missing)}\n\n"
        "Example: <code>Swap 1 SOL to USDC</code>"
    )


def format_no_route(intent: SwapIntent) -> str:
    return (
        f"❌ <b>No route found</b>\n\n"
        f"Jupiter couldn't find a route for "
        f"<b>{intent.input_token} → {intent.output_token}</b>\n\n"
        "This pair may have very low liquidity."
    )


def format_balance_mock() -> str:
    """Мок-ответ для баланса (wallet integration = день 5-6)."""
    return (
        "💼 <b>Portfolio</b>\n\n"
        "<code>"
        "SOL        2.45000\n"
        "USDC     120.00000\n"
        "BONK   1,000,000\n"
        "</code>\n\n"
        "<i>⚠️ Demo wallet — connect your real wallet to see actual balance</i>"
    )


def format_price_mock(token: str, price: float = None) -> str:
    """Форматирует цену токена."""
    if price:
        return (
            f"💲 <b>{token} Price</b>\n\n"
            f"<b>${price:,.4f}</b> USD\n"
            f"<i>Source: Jupiter Price API</i>"
        )
    return (
        f"💲 <b>{token} Price</b>\n\n"
        "Price data unavailable\n"
        f"<i>Try: <code>Swap 1 {token} to USDC</code> to get a live quote</i>"
    )


def format_mock_execute_result(intent: SwapIntent, quote: QuoteResult) -> str:
    """Мок-результат 'исполнения' транзакции."""
    mock_sig = "4xK7m...n9Rp"  # мок подпись
    return (
        "✅ <b>Transaction Submitted</b> <i>(Demo)</i>\n\n"
        f"Swapped <b>{intent.amount:g} {intent.input_token}</b> → "
        f"<b>{quote.output_amount:,.4f} {intent.output_token}</b>\n\n"
        f"Signature: <code>{mock_sig}</code>\n"
        f"Explorer: <a href='https://solscan.io/tx/{mock_sig}'>View on Solscan</a>\n\n"
        "<i>⚠️ This is a demo transaction — no real funds moved</i>"
    )


def format_help() -> str:
    return (
        "👋 <b>Intent Layer for Solana</b>\n\n"
        "Express what you want in plain English, I'll find the best route.\n\n"
        "<b>Supported intents:</b>\n"
        "• <code>Swap 1 SOL to USDC</code>\n"
        "• <code>Swap 100 USDC to BONK</code>\n"
        "• <code>Convert 0.5 ETH to SOL</code>\n"
        "• <code>Buy 1000 JUP with SOL</code>\n"
        "• <code>Sell 500 RAY</code>\n"
        "• <code>Price of BONK</code>\n"
        "• <code>My balance</code>\n\n"
        "<b>Coming soon:</b> stake, send, limit orders\n\n"
        "Powered by Jupiter Aggregator 🪐"
    )


# ─── Утилиты ─────────────────────────────────────────────────────────────────

def _impact_emoji(impact: float) -> str:
    if impact < 0.1:
        return "🟢"
    elif impact < 1.0:
        return "🟡"
    elif impact < 3.0:
        return "🟠"
    else:
        return "🔴"