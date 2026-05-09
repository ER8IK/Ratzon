from bot.intents.models import IntentType, SwapIntent

from .jupiter_adapter import JupiterAdapter
from .types import ProtocolCapability, QuoteEnvelope, SwapProtocolAdapter


class ProtocolRouter:
    def __init__(self):
        self._swap_adapters: dict[str, SwapProtocolAdapter] = {
            "jupiter": JupiterAdapter(),
        }
        self._default_swap_adapter_id = "jupiter"

    def capabilities(self) -> list[ProtocolCapability]:
        return [
            ProtocolCapability(
                adapter_id="jupiter",
                label="Jupiter",
                status="live",
                intents=(IntentType.SWAP, IntentType.RATE),
                description="Swap routing and token rates across Solana DEX liquidity.",
            ),
            ProtocolCapability(
                adapter_id="kamino",
                label="Kamino",
                status="planned",
                intents=(IntentType.LEND, IntentType.BORROW, IntentType.YIELD),
                description="Future lend, borrow, and vault strategy intents.",
            ),
            ProtocolCapability(
                adapter_id="drift",
                label="Drift",
                status="planned",
                intents=(IntentType.PERP,),
                description="Future perp and advanced trading intents.",
            ),
            ProtocolCapability(
                adapter_id="jito-marinade",
                label="Jito / Marinade",
                status="planned",
                intents=(IntentType.STAKE,),
                description="Future staking and liquid staking intents.",
            ),
        ]

    async def quote_swap(
        self,
        intent: SwapIntent,
        adapter_id: str | None = None,
    ) -> QuoteEnvelope | None:
        adapter = self._get_swap_adapter(adapter_id)
        return await adapter.quote_swap(intent)

    async def prepare_swap_transaction(
        self,
        raw_quote: dict,
        user_wallet: str,
        adapter_id: str | None = None,
    ) -> str | None:
        adapter = self._get_swap_adapter(adapter_id)
        return await adapter.prepare_swap_transaction(raw_quote, user_wallet)

    def _get_swap_adapter(self, adapter_id: str | None = None) -> SwapProtocolAdapter:
        selected = adapter_id or self._default_swap_adapter_id
        return self._swap_adapters.get(selected) or self._swap_adapters[
            self._default_swap_adapter_id
        ]


protocol_router = ProtocolRouter()
