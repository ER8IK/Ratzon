# bot/intents/parser.py
"""
Intent Parser — сердце системы.
Принимает сырой текст пользователя → возвращает типизированный Intent.

Стратегия: rule-based с regex (надёжно, быстро, без API).
Можно расширить LLM-парсингом поверх (опционально).
"""

import re
import logging
from typing import Union

from .models import (
    Intent, SwapIntent, SendIntent, BalanceIntent, PriceIntent,
    IntentType
)
from .patterns import (
    SWAP_KEYWORDS, SEND_KEYWORDS, BALANCE_KEYWORDS,
    PRICE_KEYWORDS, STAKE_KEYWORDS,
    SWAP_PATTERN, SEND_PATTERN,
    normalize_token, AMOUNT_PATTERN
)

logger = logging.getLogger(__name__)

# Тип для всех возможных интентов
AnyIntent = Union[SwapIntent, SendIntent, BalanceIntent, PriceIntent, Intent]


class IntentParser:
    """
    Rule-based парсер намерений.
    
    Порядок приоритетов:
    1. Точное совпадение по паттерну (SWAP_PATTERN и т.д.)
    2. Keyword-based классификация
    3. Fallback → UNKNOWN
    """

    def parse(self, text: str) -> AnyIntent:
        text_clean = text.strip()
        text_lower = text_clean.lower()

        logger.debug(f"Parsing intent: {text_clean!r}")

        # 1. Проверяем точные паттерны
        if self._has_keywords(text_lower, SWAP_KEYWORDS):
            intent = self._parse_swap(text_clean, text_lower)
            if intent:
                return intent

        if self._has_keywords(text_lower, SEND_KEYWORDS):
            intent = self._parse_send(text_clean, text_lower)
            if intent:
                return intent

        if self._has_keywords(text_lower, BALANCE_KEYWORDS):
            return self._parse_balance(text_clean, text_lower)

        if self._has_keywords(text_lower, PRICE_KEYWORDS):
            return self._parse_price(text_clean, text_lower)

        # 2. Fallback
        return Intent(
            raw_text=text_clean,
            intent_type=IntentType.UNKNOWN,
            confidence=0.0,
        )

    # ─── Парсеры по типам ─────────────────────────────────────────────────────

    def _parse_swap(self, text: str, text_lower: str) -> SwapIntent | None:
        """
        Примеры:
          "Swap 1 SOL to USDC"
          "обменять 0.5 sol на usdc"
          "buy 100 USDC with SOL"
          "convert 2 SOL to BONK"
        """
        # Паттерн 1: "swap AMOUNT TOKEN to TOKEN"
        match = re.search(
            r'(?:swap|exchange|trade|convert|buy|sell|обменять|своп|конвертировать)'
            r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|for|into|на|в|→|->|за)\s+(\w+)',
            text_lower, re.IGNORECASE
        )

        if match:
            amount_str, in_tok_raw, out_tok_raw = match.groups()
            amount = float(amount_str.replace(',', '.'))
            in_token = normalize_token(in_tok_raw)
            out_token = normalize_token(out_tok_raw)

            return SwapIntent(
                raw_text=text,
                intent_type=IntentType.SWAP,
                confidence=0.95,
                amount=amount,
                input_token=in_token or in_tok_raw.upper(),
                output_token=out_token or out_tok_raw.upper(),
            )

        # Паттерн 2: "buy 100 USDC" (неявный input = SOL)
        match2 = re.search(
            r'(?:buy|купить)\s+(\d+(?:[.,]\d+)?)\s+(\w+)',
            text_lower
        )
        if match2:
            amount_str, out_tok_raw = match2.groups()
            out_token = normalize_token(out_tok_raw)
            return SwapIntent(
                raw_text=text,
                intent_type=IntentType.SWAP,
                confidence=0.75,
                amount=float(amount_str.replace(',', '.')),
                input_token="SOL",  # предполагаем SOL как базовый
                output_token=out_token or out_tok_raw.upper(),
            )

        # Паттерн 3: "sell 1 SOL" (неявный output = USDC)
        match3 = re.search(
            r'(?:sell|продать)\s+(\d+(?:[.,]\d+)?)\s+(\w+)',
            text_lower
        )
        if match3:
            amount_str, in_tok_raw = match3.groups()
            in_token = normalize_token(in_tok_raw)
            return SwapIntent(
                raw_text=text,
                intent_type=IntentType.SWAP,
                confidence=0.75,
                amount=float(amount_str.replace(',', '.')),
                input_token=in_token or in_tok_raw.upper(),
                output_token="USDC",  # предполагаем USDC как выход
            )

        return None

    def _parse_send(self, text: str, text_lower: str) -> SendIntent | None:
        """
        Примеры:
          "Send 0.5 SOL to ABC123..."
          "Transfer 10 USDC to vitalik.sol"
        """
        match = re.search(
            r'(?:send|transfer|pay|отправить|перевести)'
            r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|на|для|->)\s+(\S+)',
            text_lower
        )
        if match:
            amount_str, token_raw, recipient = match.groups()
            token = normalize_token(token_raw)
            return SendIntent(
                raw_text=text,
                intent_type=IntentType.SEND,
                confidence=0.9,
                amount=float(amount_str.replace(',', '.')),
                token=token or token_raw.upper(),
                recipient=recipient,
            )
        return None

    def _parse_balance(self, text: str, text_lower: str) -> BalanceIntent:
        """
        Примеры:
          "What's my balance?"
          "Show SOL balance"
          "баланс usdc"
        """
        # Ищем конкретный токен в запросе
        token = None
        words = text_lower.split()
        for word in words:
            t = normalize_token(word)
            if t:
                token = t
                break

        return BalanceIntent(
            raw_text=text,
            intent_type=IntentType.BALANCE,
            confidence=0.85,
            token=token,
        )

    def _parse_price(self, text: str, text_lower: str) -> PriceIntent:
        """
        Примеры:
          "Price of SOL"
          "How much is BONK"
          "SOL price"
        """
        token = None
        words = re.findall(r'\b\w+\b', text_lower)
        for word in words:
            t = normalize_token(word)
            if t and t not in ("USDC", "USD"):  # пропускаем базовую валюту
                token = t
                break

        return PriceIntent(
            raw_text=text,
            intent_type=IntentType.PRICE,
            confidence=0.85,
            token=token,
        )

    # ─── Утилиты ─────────────────────────────────────────────────────────────

    @staticmethod
    def _has_keywords(text: str, keywords: list[str]) -> bool:
        for kw in keywords:
            if kw in text:
                return True
        return False


# Глобальный синглтон парсера
intent_parser = IntentParser()