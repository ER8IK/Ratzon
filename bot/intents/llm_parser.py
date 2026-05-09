# bot/intents/llm_parser.py
"""
Гибридный парсер интентов.

Стратегия:
1. Сначала пробуем быстрый regex (confidence > 0.85)
2. Если regex не уверен → отправляем в QVAC LLM
3. Если QVAC недоступен → fallback на regex

Это "meaningful integration" QVAC — LLM используется для реальной задачи.
"""

import logging
import os
import aiohttp
from typing import Optional

from .models import (
    Intent, SwapIntent, SendIntent, BalanceIntent,
    PriceIntent, RateIntent, CompareIntent, ProtocolIntent, IntentType
)
from .patterns import normalize_token

logger = logging.getLogger(__name__)

QVAC_URL = os.getenv("QVAC_URL", "http://localhost:3000")
QVAC_TIMEOUT = aiohttp.ClientTimeout(total=15)  # LLM медленнее regex


class LLMParser:
    """
    Клиент для QVAC LLM сервиса.
    Вызывается только когда regex не справляется.
    """

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None
        self._available: Optional[bool] = None  # кэшируем статус

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=QVAC_TIMEOUT)
        return self._session

    async def is_available(self) -> bool:
        """Проверяет доступность QVAC сервиса."""
        try:
            session = await self._get_session()
            async with session.get(f"{QVAC_URL}/health") as resp:
                self._available = resp.status == 200
                return self._available
        except Exception:
            self._available = False
            return False

    async def parse(self, text: str) -> Optional[dict]:
        """
        Отправляет текст в QVAC LLM и получает структурированный интент.

        Returns:
            dict с полями intent, amount, input_token, output_token, confidence
            или None если сервис недоступен
        """
        try:
            session = await self._get_session()
            async with session.post(
                f"{QVAC_URL}/parse",
                json={"message": text}
            ) as resp:
                if resp.status != 200:
                    logger.warning(f"QVAC returned {resp.status}")
                    return None
                data = await resp.json()
                logger.info(f"QVAC LLM result: {data}")
                return data

        except aiohttp.ClientConnectorError:
            if self._available is not False:
                logger.warning("QVAC service not available, using regex fallback")
                self._available = False
            return None
        except Exception as e:
            logger.error(f"QVAC parse error: {e}")
            return None

    async def transcribe(self, audio_bytes: bytes) -> Optional[str]:
        """
        Транскрибирует аудио в текст через QVAC Whisper.

        Args:
            audio_bytes: аудио в формате WAV/OGG

        Returns:
            Распознанный текст или None
        """
        try:
            session = await self._get_session()
            async with session.post(
                f"{QVAC_URL}/transcribe",
                data=audio_bytes,
                headers={"Content-Type": "application/octet-stream"}
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                return data.get("text")

        except Exception as e:
            logger.error(f"QVAC transcribe error: {e}")
            return None

    def build_intent_from_llm(self, llm_result: dict, raw_text: str) -> Intent:
        """
        Строит типизированный Intent из ответа LLM.
        """
        intent_type_str = llm_result.get("intent", "unknown")
        confidence = float(llm_result.get("confidence", 0.7))

        def get_token(key: str) -> Optional[str]:
            val = llm_result.get(key)
            if not val:
                return None
            # Нормализуем через наш реестр
            normalized = normalize_token(val.lower())
            return normalized or val.upper()

        try:
            intent_type = IntentType(intent_type_str)
        except ValueError:
            intent_type = IntentType.UNKNOWN

        if intent_type == IntentType.SWAP:
            return SwapIntent(
                raw_text=raw_text,
                intent_type=IntentType.SWAP,
                confidence=confidence,
                amount=llm_result.get("amount"),
                input_token=get_token("input_token"),
                output_token=get_token("output_token"),
            )

        elif intent_type == IntentType.PRICE:
            return PriceIntent(
                raw_text=raw_text,
                intent_type=IntentType.PRICE,
                confidence=confidence,
                token=get_token("token") or get_token("input_token"),
            )

        elif intent_type == IntentType.BALANCE:
            return BalanceIntent(
                raw_text=raw_text,
                intent_type=IntentType.BALANCE,
                confidence=confidence,
            )

        elif intent_type == IntentType.COMPARE:
            return CompareIntent(
                raw_text=raw_text,
                intent_type=IntentType.COMPARE,
                confidence=confidence,
                token_a=get_token("token_a"),
                token_b=get_token("token_b"),
            )

        elif intent_type == IntentType.RATE:
            return RateIntent(
                raw_text=raw_text,
                intent_type=IntentType.RATE,
                confidence=confidence,
                amount=llm_result.get("amount", 1.0),
                input_token=get_token("input_token"),
                output_token=get_token("output_token"),
            )

        elif intent_type in {
            IntentType.LEND,
            IntentType.BORROW,
            IntentType.STAKE,
            IntentType.PERP,
            IntentType.YIELD,
        }:
            protocol = llm_result.get("protocol")
            action = llm_result.get("action") or intent_type.value
            return ProtocolIntent(
                raw_text=raw_text,
                intent_type=intent_type,
                confidence=confidence,
                protocol=protocol,
                action=action,
                amount=llm_result.get("amount"),
                token=get_token("token") or get_token("input_token"),
                side=llm_result.get("side"),
                leverage=llm_result.get("leverage"),
            )

        return Intent(
            raw_text=raw_text,
            intent_type=IntentType.UNKNOWN,
            confidence=confidence,
        )

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()


# Синглтон
llm_parser = LLMParser()
