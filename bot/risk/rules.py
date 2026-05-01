# bot/risk/rules.py
"""
Набор риск-правил.
Каждое правило — функция (context) → (warning_msg | None, score_delta).
"""

from dataclasses import dataclass
from typing import Callable, Optional

from bot.intents.models import SwapIntent, QuoteResult, RiskReport
from bot.solana.tokens import is_trusted, is_stablecoin


@dataclass
class RiskContext:
    """Контекст для риск-оценки."""
    intent: SwapIntent
    quote: Optional[QuoteResult] = None


# ─── Правила ─────────────────────────────────────────────────────────────────

def rule_unknown_token(ctx: RiskContext) -> list[tuple[str, int]]:
    """Предупреждение если токен неизвестен."""
    results = []
    if not is_trusted(ctx.intent.input_token):
        results.append((
            f"⚠️ Input token `{ctx.intent.input_token}` not in trusted list",
            30
        ))
    if not is_trusted(ctx.intent.output_token):
        results.append((
            f"⚠️ Output token `{ctx.intent.output_token}` not in trusted list",
            30
        ))
    return results


def rule_high_price_impact(ctx: RiskContext) -> list[tuple[str, int]]:
    """Предупреждение при высоком price impact."""
    if ctx.quote is None:
        return []

    impact = ctx.quote.price_impact_pct
    results = []

    if impact > 5.0:
        results.append((
            f"🔴 Very high price impact: {impact:.2f}% — you may get a bad rate",
            40
        ))
    elif impact > 1.0:
        results.append((
            f"🟡 Moderate price impact: {impact:.2f}% — consider splitting the trade",
            20
        ))
    elif impact > 0.5:
        results.append((
            f"🟡 Slight price impact: {impact:.2f}%",
            5
        ))
    return results


def rule_large_amount(ctx: RiskContext) -> list[tuple[str, int]]:
    """Предупреждение при крупной сумме."""
    results = []
    amount = ctx.intent.amount

    # Считаем в SOL-эквиваленте (грубо)
    sol_equivalent = amount
    if ctx.intent.input_token == "USDC" or is_stablecoin(ctx.intent.input_token):
        sol_equivalent = amount / 150  # приблизительный курс SOL

    if sol_equivalent > 1000:
        results.append((
            f"⚠️ Very large trade: {amount:,.2f} {ctx.intent.input_token} — double-check before proceeding",
            25
        ))
    elif sol_equivalent > 100:
        results.append((
            f"ℹ️ Large trade: {amount:,.2f} {ctx.intent.input_token}",
            5
        ))
    return results


def rule_low_output(ctx: RiskContext) -> list[tuple[str, int]]:
    """Предупреждение если выходная сумма подозрительно мала."""
    if ctx.quote is None:
        return []
    if ctx.quote.output_amount == 0:
        return [(
            "🔴 No liquidity found for this pair — trade cannot be executed",
            50
        )]
    return []


def rule_stablecoin_swap(ctx: RiskContext) -> list[tuple[str, int]]:
    """Информация при обмене стейблкоинов."""
    if (is_stablecoin(ctx.intent.input_token) and
            is_stablecoin(ctx.intent.output_token)):
        return [(
            "ℹ️ Stablecoin-to-stablecoin swap — check the peg and fees",
            5
        )]
    return []


def rule_meme_token(ctx: RiskContext) -> list[tuple[str, int]]:
    """Предупреждение при торговле мемкоинами."""
    meme_tokens = {"BONK", "WIF", "MYRO", "BOME", "POPCAT", "SLERF"}
    results = []
    
    if ctx.intent.output_token in meme_tokens:
        results.append((
            f"🎰 `{ctx.intent.output_token}` is a meme token — high volatility risk",
            15
        ))
    return results


# ─── Реестр всех правил ───────────────────────────────────────────────────────

ALL_RULES: list[Callable[[RiskContext], list[tuple[str, int]]]] = [
    rule_unknown_token,
    rule_high_price_impact,
    rule_large_amount,
    rule_low_output,
    rule_stablecoin_swap,
    rule_meme_token,
]