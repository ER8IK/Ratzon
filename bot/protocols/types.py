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


@dataclass(frozen=True)
class ProviderLimits:
    min_amount: float
    max_amount: float | None = None
    network_fee_note: str = ""


@dataclass
class PaymentDetails:
    amount_to_send: float
    token: str
    network: str
    payin_address: str
    memo: str | None = None
    expires_at: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "amount_to_send": self.amount_to_send,
            "token": self.token,
            "network": self.network,
            "payin_address": self.payin_address,
            "memo": self.memo,
            "expires_at": self.expires_at,
        }


@dataclass
class ProviderOrder:
    provider_order_id: str
    status: str
    payment_details: PaymentDetails
    raw: dict[str, Any]


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

    async def limits(self, intent: SwapIntent) -> ProviderLimits:
        ...

    async def create_order(
        self,
        intent: SwapIntent,
        payout_address: str,
    ) -> ProviderOrder:
        ...

    async def status(self, provider_order_id: str) -> str:
        ...
