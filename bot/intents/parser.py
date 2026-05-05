# bot/intents/parser.py
"""
Гибридный Intent Parser.

Regex быстро → если confidence низкий → QVAC LLM.
Лучшее из двух миров: скорость + интеллект.
"""

import re
import logging
from typing import Union

from .models import (
    Intent, SwapIntent, SendIntent, BalanceIntent, PriceIntent,
    RateIntent, CompareIntent, IntentType
)
from .patterns import (
    SWAP_KEYWORDS, SEND_KEYWORDS, BALANCE_KEYWORDS,
    PRICE_KEYWORDS, RATE_KEYWORDS, COMPARE_KEYWORDS,
    normalize_token,
)
from .llm_parser import llm_parser

logger = logging.getLogger(__name__)

AnyIntent = Union[
    SwapIntent, SendIntent, BalanceIntent,
    PriceIntent, RateIntent, CompareIntent, Intent
]

# Если regex confidence ниже этого порога — идём в LLM
LLM_THRESHOLD = 0.85


class IntentParser:

    async def parse(self, text: str) -> AnyIntent:
        """
        Главный метод парсинга.
        Async потому что может вызывать QVAC LLM.
        """
        t = text.strip()
        tl = t.lower()
        logger.debug(f"Parsing: {t!r}")

        # Шаг 1: быстрый regex
        intent = self._parse_regex(t, tl)

        # Шаг 2: если regex не уверен → QVAC LLM
        if intent.confidence < LLM_THRESHOLD:
            logger.info(
                f"Regex confidence {intent.confidence:.2f} < {LLM_THRESHOLD}, "
                f"trying QVAC LLM..."
            )
            llm_result = await llm_parser.parse(t)

            if llm_result and llm_result.get("confidence", 0) > intent.confidence:
                llm_intent = llm_parser.build_intent_from_llm(llm_result, t)
                logger.info(
                    f"LLM improved: {intent.intent_type} → {llm_intent.intent_type} "
                    f"(conf: {llm_intent.confidence:.2f})"
                )
                return llm_intent

        return intent

    def parse_sync(self, text: str) -> AnyIntent:
        """Синхронный парсинг только через regex (для /demo команды)."""
        t = text.strip()
        return self._parse_regex(t, t.lower())

    # ── Regex парсер ─────────────────────────────────────────────────────────

    def _parse_regex(self, text: str, tl: str) -> AnyIntent:
        if self._has_keywords(tl, COMPARE_KEYWORDS):
            intent = self._parse_compare(text, tl)
            if intent:
                return intent

        if self._has_keywords(tl, SWAP_KEYWORDS):
            intent = self._parse_swap(text, tl)
            if intent:
                return intent

        if self._has_keywords(tl, SEND_KEYWORDS):
            intent = self._parse_send(text, tl)
            if intent:
                return intent

        if self._has_keywords(tl, BALANCE_KEYWORDS):
            return self._parse_balance(text, tl)

        if self._has_keywords(tl, RATE_KEYWORDS):
            intent = self._parse_rate(text, tl)
            if intent:
                return intent

        if self._has_keywords(tl, PRICE_KEYWORDS):
            return self._parse_price(text, tl)

        token = self._extract_any_token(tl)
        if token:
            return PriceIntent(
                raw_text=text, intent_type=IntentType.PRICE,
                confidence=0.5, token=token,
            )

        return Intent(raw_text=text, intent_type=IntentType.UNKNOWN, confidence=0.0)

    def _parse_compare(self, text: str, tl: str) -> CompareIntent | None:
        cleaned = re.sub(r'\b(to|with|and|и)\b', ' ', tl)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        match = re.search(r'compare\s+(\w+)\s+(\w+)', cleaned)
        if match:
            a_raw, b_raw = match.groups()
            token_a = normalize_token(a_raw)
            token_b = normalize_token(b_raw)
            if token_a or token_b:
                return CompareIntent(
                    raw_text=text, intent_type=IntentType.COMPARE, confidence=0.9,
                    token_a=token_a or a_raw.upper(),
                    token_b=token_b or b_raw.upper(),
                )

        match = re.search(r'(\w+)\s+(?:vs|versus|против)\s+(\w+)', tl)
        if match:
            a_raw, b_raw = match.groups()
            token_a = normalize_token(a_raw)
            token_b = normalize_token(b_raw)
            if token_a or token_b:
                return CompareIntent(
                    raw_text=text, intent_type=IntentType.COMPARE, confidence=0.85,
                    token_a=token_a or a_raw.upper(),
                    token_b=token_b or b_raw.upper(),
                )
        return None

    def _parse_swap(self, text: str, tl: str) -> SwapIntent | None:
        match = re.search(
            r'(?:swap|exchange|trade|convert|обменять|своп|конвертировать)'
            r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+'
            r'(?:to|for|into|на|в|→|->|за)\s+(\w+)', tl
        )
        if match:
            amount, in_raw, out_raw = match.groups()
            return SwapIntent(
                raw_text=text, intent_type=IntentType.SWAP, confidence=0.95,
                amount=float(amount.replace(',', '.')),
                input_token=normalize_token(in_raw) or in_raw.upper(),
                output_token=normalize_token(out_raw) or out_raw.upper(),
            )

        match = re.search(r'(?:buy|купить)\s+(\d+(?:[.,]\d+)?)\s+(\w+)', tl)
        if match:
            amount, out_raw = match.groups()
            return SwapIntent(
                raw_text=text, intent_type=IntentType.SWAP, confidence=0.75,
                amount=float(amount.replace(',', '.')),
                input_token="SOL",
                output_token=normalize_token(out_raw) or out_raw.upper(),
            )

        match = re.search(r'(?:sell|продать)\s+(\d+(?:[.,]\d+)?)\s+(\w+)', tl)
        if match:
            amount, in_raw = match.groups()
            return SwapIntent(
                raw_text=text, intent_type=IntentType.SWAP, confidence=0.75,
                amount=float(amount.replace(',', '.')),
                input_token=normalize_token(in_raw) or in_raw.upper(),
                output_token="USDC",
            )
        return None

    def _parse_send(self, text: str, tl: str) -> SendIntent | None:
        match = re.search(
            r'(?:send|transfer|pay|отправить|перевести)'
            r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|на|для|->)\s+(\S+)', tl
        )
        if match:
            amount, token_raw, recipient = match.groups()
            return SendIntent(
                raw_text=text, intent_type=IntentType.SEND, confidence=0.9,
                amount=float(amount.replace(',', '.')),
                token=normalize_token(token_raw) or token_raw.upper(),
                recipient=recipient,
            )
        return None

    def _parse_balance(self, text: str, tl: str) -> BalanceIntent:
        return BalanceIntent(
            raw_text=text, intent_type=IntentType.BALANCE,
            confidence=0.85, token=self._extract_any_token(tl),
        )

    def _parse_price(self, text: str, tl: str) -> PriceIntent:
        return PriceIntent(
            raw_text=text, intent_type=IntentType.PRICE,
            confidence=0.85, token=self._extract_any_token(tl),
        )

    def _parse_rate(self, text: str, tl: str) -> RateIntent | None:
        match = re.search(
            r'how much\s+(\w+)\s+(?:for|is)\s+(\d+(?:[.,]\d+)?)\s+(\w+)', tl
        )
        if match:
            out_raw, amount, in_raw = match.groups()
            return RateIntent(
                raw_text=text, intent_type=IntentType.RATE, confidence=0.85,
                amount=float(amount.replace(',', '.')),
                input_token=normalize_token(in_raw) or in_raw.upper(),
                output_token=normalize_token(out_raw) or out_raw.upper(),
            )

        match = re.search(r'rate\s+(\w+)\s+(?:to|vs|/)\s+(\w+)', tl)
        if match:
            in_raw, out_raw = match.groups()
            return RateIntent(
                raw_text=text, intent_type=IntentType.RATE, confidence=0.8,
                amount=1.0,
                input_token=normalize_token(in_raw) or in_raw.upper(),
                output_token=normalize_token(out_raw) or out_raw.upper(),
            )
        return None

    def _extract_any_token(self, tl: str) -> str | None:
        for word in re.findall(r'\b\w+\b', tl):
            t = normalize_token(word)
            if t:
                return t
        return None

    @staticmethod
    def _has_keywords(text: str, keywords: list[str]) -> bool:
        return any(kw in text for kw in keywords)


intent_parser = IntentParser()