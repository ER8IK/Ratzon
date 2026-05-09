from dataclasses import dataclass
from typing import Any, Protocol

from bot.intents.models import IntentType, QuoteResult, SwapIntent


@dataclass(frozen=True)
class ProtocolCapability:
    adapter_id: str
    label: str
    status: str
    intents: tuple[IntentType, ...]
    description: str


@dataclass
class QuoteEnvelope:
    adapter_id: str
    quote: QuoteResult
    raw_quote: dict[str, Any]


class SwapProtocolAdapter(Protocol):
    adapter_id: str
    label: str
    supported_intents: tuple[IntentType, ...]

    async def quote_swap(self, intent: SwapIntent) -> QuoteEnvelope | None:
        ...

    async def prepare_swap_transaction(
        self,
        raw_quote: dict[str, Any],
        user_wallet: str,
    ) -> str | None:
        ...
