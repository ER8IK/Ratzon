from bot.intents.models import IntentType, SwapIntent
from bot.solana.jupiter import jupiter_client

from .types import ProviderLimits, QuoteEnvelope


class JupiterAdapter:
    adapter_id = "jupiter"
    label = "Jupiter"
    supported_intents = (IntentType.SWAP, IntentType.RATE)

    async def quote_swap(self, intent: SwapIntent) -> QuoteEnvelope | None:
        quote, raw_quote = await jupiter_client.get_quote(intent)
        if quote is None or raw_quote is None:
            return None
        return QuoteEnvelope(
            adapter_id=self.adapter_id,
            quote=quote,
            raw_quote=raw_quote,
        )

    async def prepare_swap_transaction(
        self,
        raw_quote: dict,
        user_wallet: str,
    ) -> str | None:
        return await jupiter_client.get_swap_transaction(
            quote_response=raw_quote,
            user_wallet=user_wallet,
        )

    async def limits(self, intent: SwapIntent) -> ProviderLimits:
        return ProviderLimits(min_amount=0.0)

    async def create_order(self, intent: SwapIntent, payout_address: str):
        raise NotImplementedError("Jupiter swaps are wallet-signed, not payment orders.")

    async def status(self, provider_order_id: str) -> str:
        return "wallet_signature_required"
