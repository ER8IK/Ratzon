# bot/services/dispatcher.py
"""
Диспетчер интентов.
Оркестрирует весь pipeline: parse → quote → risk → format.

Это главный сервисный слой, вызываемый из aiogram handlers.
"""

import logging
from dataclasses import dataclass

from bot.intents.models import (
    AnyIntent, IntentType, SwapIntent, BalanceIntent, PriceIntent,
    QuoteResult, RiskReport
)
from bot.solana.jupiter_price import jupiter_price_client
from bot.solana.jupiter import jupiter_client
from bot.risk.engine import risk_engine
from bot.services import formatter

logger = logging.getLogger(__name__)


@dataclass
class DispatchResult:
    """Результат обработки интента — готовый ответ для Telegram."""
    text: str
    show_confirm_button: bool = False
    intent: AnyIntent = None
    quote: QuoteResult = None
    risk: RiskReport = None


class IntentDispatcher:
    """
    Маршрутизирует интент к нужному обработчику и возвращает DispatchResult.
    """

    async def dispatch(self, intent: AnyIntent) -> DispatchResult:
        """
        Главный метод — принимает любой интент, возвращает готовый ответ.
        """
        logger.info(f"Dispatching intent type={intent.intent_type}")

        if intent.intent_type == IntentType.SWAP:
            return await self._handle_swap(intent)

        elif intent.intent_type == IntentType.BALANCE:
            return self._handle_balance(intent)

        elif intent.intent_type == IntentType.PRICE:
            return await self._handle_price(intent)

        else:
            return DispatchResult(
                text=formatter.format_intent_unknown(intent.raw_text),
                intent=intent,
            )

    # ─── Handlers ─────────────────────────────────────────────────────────────

    async def _handle_swap(self, intent: SwapIntent) -> DispatchResult:
        """
        Pipeline для swap:
        1. Валидация интента
        2. Запрос котировки в Jupiter
        3. Риск-оценка
        4. Форматирование
        """
        # Шаг 1: валидация
        if not intent.is_valid():
            return DispatchResult(
                text=formatter.format_parse_error(intent),
                intent=intent,
            )

        # Шаг 2: получаем котировку (реальные данные!)
        logger.info(
            f"Getting Jupiter quote: {intent.amount} "
            f"{intent.input_token} → {intent.output_token}"
        )
        quote = await jupiter_client.get_quote(intent)

        if quote is None:
            return DispatchResult(
                text=formatter.format_no_route(intent),
                intent=intent,
            )

        # Шаг 3: риск-оценка
        risk = risk_engine.evaluate(intent, quote)

        # Шаг 4: форматируем ответ
        text = formatter.format_swap_response(intent, quote, risk)

        return DispatchResult(
            text=text,
            show_confirm_button=True,
            intent=intent,
            quote=quote,
            risk=risk,
        )

    def _handle_balance(self, intent: BalanceIntent) -> DispatchResult:
        """Показывает мок-баланс (реальный wallet = будущая фича)."""
        return DispatchResult(
            text=formatter.format_balance_mock(),
            intent=intent,
        )

    async def _handle_price(self, intent: PriceIntent) -> DispatchResult:
        """
        Получает цену через Jupiter (свапаем 1 токен в USDC чтобы получить цену).
        """
        if not intent.token:
            return DispatchResult(
                text="❓ Which token price do you want to check?",
                intent=intent,
            )

        # Хак: используем swap quote для получения цены
        price_intent = SwapIntent(
            raw_text=f"swap 1 {intent.token} to USDC",
            intent_type=IntentType.SWAP,
            confidence=1.0,
            amount=1.0,
            input_token=intent.token,
            output_token="USDC",
        )

        quote = await jupiter_client.get_quote(price_intent)

        price = quote.output_amount if quote else None
        return DispatchResult(
            text=formatter.format_price_mock(intent.token, price),
            intent=intent,
            quote=quote,
        )


# Синглтон
intent_dispatcher = IntentDispatcher()